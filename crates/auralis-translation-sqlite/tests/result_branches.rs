#[path = "support/validated_edit_fixture.rs"]
mod fixture;
mod support;

use auralis_translation_sqlite::{DbError, EditProvenance, SqliteConfig, TranslateDb};
use fixture::{EditFixture, edit, result_id};
use rusqlite::{Connection, params};
use std::{
    error::Error,
    sync::{Arc, Barrier},
};

#[test]
fn branches_copy_the_chosen_base_and_keep_divergent_results_and_edits() -> Result<(), Box<dyn Error>>
{
    let mut f = EditFixture::new()?;
    let first = f.first.clone();
    let checkpoints = f.db.checkpoints(f.run.run_id)?;
    let second_edit = edit(first.result_id, 2, 1, "Здравствуйте.")?;
    let second = f.db.commit_edit(&second_edit, &f.plan)?;
    let third_edit = edit(second.result_id, 3, 2, "До свидания.")?;
    let third = f.db.commit_edit(&third_edit, &f.plan)?;
    let branch = f.branch(first.result_id, third.result_id, 4, 1, "Привет.")?;
    let fourth = f.db.commit_branch_edit(&branch, &f.plan)?;
    assert_eq!(fourth.revision, 4);
    assert_eq!(fourth.selected[0].lines, ["Привет."]);
    assert_eq!(fourth.selected[1], first.selected[1]);
    assert_eq!(f.db.result_edits(fourth.result_id)?.len(), 1);
    assert_eq!(
        f.db.result_edit_provenance(fourth.result_id)?,
        Some(EditProvenance {
            base_result_id: first.result_id,
            observed_head_result_id: third.result_id,
            segment_id: branch.edit.segment_id
        })
    );
    let inherited = f.branch(second.result_id, fourth.result_id, 5, 2, "Пока.")?;
    let fifth = f.db.commit_branch_edit(&inherited, &f.plan)?;
    assert_eq!(fifth.revision, 5);
    assert_eq!(fifth.selected[0], second.selected[0]);
    assert_eq!(fifth.selected[1].lines, ["Пока."]);
    assert_eq!(f.db.result_edits(fifth.result_id)?.len(), 2);
    assert_eq!(f.db.result(first.result_id)?, first);
    assert_eq!(f.db.result(second.result_id)?, second);
    assert_eq!(f.db.result(third.result_id)?, third);
    assert_eq!(f.db.checkpoints(f.run.run_id)?, checkpoints);
    drop(f.db);
    f.db = TranslateDb::open(&f.path, SqliteConfig::default())?;
    assert_eq!(f.db.result_for_run(f.run.run_id)?, fifth);
    assert_eq!(
        f.db.result_edit_provenance(fifth.result_id)?
            .ok_or("missing ancestry")?
            .base_result_id,
        second.result_id
    );
    f.finish()
}

#[test]
fn identical_branch_retry_survives_later_edits_but_changed_ancestry_conflicts()
-> Result<(), Box<dyn Error>> {
    let mut f = EditFixture::new()?;
    let second =
        f.db.commit_edit(&edit(f.first.result_id, 2, 2, "Позже.")?, &f.plan)?;
    let mut request = f.branch(f.first.result_id, second.result_id, 3, 1, "Привет.")?;
    let branch = f.db.commit_branch_edit(&request, &f.plan)?;
    f.db.commit_edit(&edit(branch.result_id, 4, 2, "Дальше.")?, &f.plan)?;
    assert_eq!(f.db.commit_branch_edit(&request, &f.plan)?, branch);
    request.expected_head_result_id = f.first.result_id;
    assert!(matches!(
        f.db.commit_branch_edit(&request, &f.plan),
        Err(DbError::Conflict(_))
    ));
    request.expected_head_result_id = second.result_id;
    request.edit.base_result_id = second.result_id;
    assert!(matches!(
        f.db.commit_branch_edit(&request, &f.plan),
        Err(DbError::Conflict(_))
    ));
    request.edit.base_result_id = f.first.result_id;
    request.edit.lines = vec!["Иная правка.".into()];
    assert!(matches!(
        f.db.commit_branch_edit(&request, &f.plan),
        Err(DbError::Conflict(_))
    ));
    assert_eq!(f.db.result_for_run(f.run.run_id)?.revision, 4);
    f.finish()
}

#[test]
fn stale_heads_and_malformed_edits_leave_no_partial_rows() -> Result<(), Box<dyn Error>> {
    let mut f = EditFixture::new()?;
    let second =
        f.db.commit_edit(&edit(f.first.result_id, 2, 2, "Пока.")?, &f.plan)?;
    for (head, text) in [
        (f.first.result_id, "Привет."),
        (result_id(99)?, "Привет."),
        (second.result_id, "bad\ncue"),
    ] {
        let request = f.branch(f.first.result_id, head, 3, 1, text)?;
        assert!(f.db.commit_branch_edit(&request, &f.plan).is_err());
    }
    let stale_ordinary = edit(f.first.result_id, 3, 1, "Привет.")?;
    assert!(matches!(
        f.db.commit_edit(&stale_ordinary, &f.plan),
        Err(DbError::Conflict(_))
    ));
    assert_eq!(f.db.result_for_run(f.run.run_id)?, second);
    let connection = Connection::open(&f.path)?;
    let counts: (u32, u32, u32) = connection.query_row("SELECT (SELECT COUNT(*) FROM results), (SELECT COUNT(*) FROM segment_edits), (SELECT COUNT(*) FROM result_edit_provenance)", [], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))?;
    assert_eq!(counts, (2, 1, 1));
    drop(connection);
    f.finish()
}

#[test]
fn a_stored_head_from_another_validated_run_cannot_authorize_a_branch() -> Result<(), Box<dyn Error>>
{
    let mut f = EditFixture::new()?;
    let foreign = f.add_validated_run()?;
    let request = f.branch(f.first.result_id, foreign.result_id, 3, 1, "Привет.")?;
    assert!(matches!(
        f.db.commit_branch_edit(&request, &f.plan),
        Err(DbError::Conflict(_))
    ));
    assert_eq!(f.db.result_for_run(f.run.run_id)?, f.first);
    assert_eq!(f.db.result_for_run(foreign.run_id)?, foreign);
    assert!(f.db.result(request.edit.result_id).is_err());
    f.finish()
}

#[test]
fn simultaneous_branches_commit_one_head_and_reject_the_other() -> Result<(), Box<dyn Error>> {
    let f = EditFixture::new()?;
    let barrier = Arc::new(Barrier::new(2));
    let outcomes = std::thread::scope(|scope| {
        let workers = [3, 4].map(|id| {
            let barrier = barrier.clone();
            let path = &f.path;
            let plan = &f.plan;
            let request = f
                .branch(
                    f.first.result_id,
                    f.first.result_id,
                    id,
                    1,
                    if id == 3 {
                        "Привет."
                    } else {
                        "Здравствуйте."
                    },
                )
                .map_err(|error| error.to_string());
            scope.spawn(move || -> Result<_, String> {
                barrier.wait();
                let request = request?;
                let mut db = TranslateDb::open(path, SqliteConfig::default())
                    .map_err(|error| error.to_string())?;
                Ok(db.commit_branch_edit(&request, plan))
            })
        });
        workers.map(|worker| worker.join().map_err(|_| "branch worker panicked"))
    });
    let [left, right] = outcomes;
    let left = left?.map_err(std::io::Error::other)?;
    let right = right?.map_err(std::io::Error::other)?;
    let winner = match (left, right) {
        (Ok(winner), Err(DbError::Conflict(_))) | (Err(DbError::Conflict(_)), Ok(winner)) => winner,
        _ => return Err("concurrent branches did not yield one winner and one stale head".into()),
    };
    assert_eq!(winner.revision, 2);
    assert_eq!(f.db.result_for_run(f.run.run_id)?, winner);
    f.finish()
}

#[test]
fn v5_upgrade_retains_old_results_without_inventing_ancestry() -> Result<(), Box<dyn Error>> {
    let mut f = EditFixture::new()?;
    let second =
        f.db.commit_edit(&edit(f.first.result_id, 2, 2, "Пока.")?, &f.plan)?;
    drop(f.db);
    let connection = Connection::open(&f.path)?;
    connection.execute_batch("DROP TABLE inference_requests; DROP TABLE result_edit_provenance; PRAGMA user_version = 5;")?;
    drop(connection);
    f.db = TranslateDb::open(&f.path, SqliteConfig::default())?;
    assert_eq!(f.db.schema_version()?, 9);
    assert_eq!(f.db.result(second.result_id)?, second);
    assert_eq!(f.db.result_edit_provenance(second.result_id)?, None);
    assert_eq!(f.db.result_edits(second.result_id)?.len(), 1);
    assert_eq!(
        f.db.commit_edit(&edit(f.first.result_id, 2, 2, "Пока.")?, &f.plan)?,
        second
    );
    let branch = f.branch(f.first.result_id, second.result_id, 3, 1, "Привет.")?;
    let third = f.db.commit_branch_edit(&branch, &f.plan)?;
    assert_eq!(third.revision, 3);
    assert!(f.db.result_edit_provenance(third.result_id)?.is_some());
    f.finish()
}

#[test]
fn provenance_corruption_is_rejected_and_project_cleanup_cascades_branches()
-> Result<(), Box<dyn Error>> {
    let mut f = EditFixture::new()?;
    let second =
        f.db.commit_edit(&edit(f.first.result_id, 2, 2, "Пока.")?, &f.plan)?;
    let branch = f.branch(f.first.result_id, second.result_id, 3, 1, "Привет.")?;
    let third = f.db.commit_branch_edit(&branch, &f.plan)?;
    let connection = Connection::open(&f.path)?;
    connection.execute(
        "UPDATE result_edit_provenance SET base_result_id = ?1 WHERE result_id = ?2",
        params![second.result_id.to_string(), third.result_id.to_string()],
    )?;
    assert!(matches!(
        f.db.result_edit_provenance(third.result_id),
        Err(DbError::CorruptRecord(_))
    ));
    connection.execute(
        "UPDATE result_edit_provenance SET base_result_id = ?1 WHERE result_id = ?2",
        params![f.first.result_id.to_string(), third.result_id.to_string()],
    )?;
    connection.execute(
        "DELETE FROM result_edit_selections WHERE result_id = ?1 AND segment_id = ?2",
        params![third.result_id.to_string(), branch.edit.segment_id.get()],
    )?;
    assert!(matches!(
        f.db.result_edit_provenance(third.result_id),
        Err(DbError::CorruptRecord(_))
    ));
    assert!(f.db.delete_project_translation(f.translation.translation_id, "project-1")?);
    let remaining: u32 =
        connection.query_row("SELECT COUNT(*) FROM result_edit_provenance", [], |row| {
            row.get(0)
        })?;
    let foreign_keys: u32 =
        connection.query_row("SELECT COUNT(*) FROM pragma_foreign_key_check", [], |row| {
            row.get(0)
        })?;
    assert_eq!((remaining, foreign_keys), (0, 0));
    drop(connection);
    f.finish()
}
