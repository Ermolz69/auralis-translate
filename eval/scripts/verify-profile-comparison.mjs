import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildSrt, digest, loadRows } from './flores-file-fixture.mjs';
import { compareProfiles } from './profile-comparison-report.mjs';
import { profileVariants } from './profile-matrix.mjs';

async function main() {
  const directory = process.argv[2];
  assert(directory && path.isAbsolute(directory), 'Supply an absolute local report directory');
  const comparison = JSON.parse(await fs.readFile(path.join(directory, 'comparison.json')));
  const matrixBytes = await fs.readFile(path.join(directory, 'matrix.json'));
  const matrix = JSON.parse(matrixBytes);
  const variants = profileVariants(matrix, await fs.readFile(matrix.base_profile), await fs.readFile(matrix.sample_manifest));
  const sample = JSON.parse(await fs.readFile(matrix.sample_manifest));
  const corpus = JSON.parse(await fs.readFile(sample.corpus_manifest));
  const expectedRows = await loadRows(process.cwd(), sample, corpus);
  const expectedSourceSha256 = digest(buildSrt(expectedRows));
  assert.equal(comparison.matrix_sha256, digest(matrixBytes));
  assert.deepEqual(comparison.entries.map((entry) => entry.id), variants.map((variant) => variant.id));
  const verified = compareProfiles(comparison.entries, digest(matrixBytes));
  assert.equal(verified.all_transport_checks_passed, true, 'Comparison includes failed variants');
  assert.deepEqual(comparison.rows, verified.rows);
  assert.equal(comparison.winner, null);
  assert.equal(comparison.quality_verdict, 'unreviewed');
  for (const [index, entry] of comparison.entries.entries()) {
    assert.deepEqual(entry.report.row_ids, sample.row_ids);
    assert.equal(entry.report.sample_manifest_sha256, matrix.sample_manifest_sha256);
    assert.equal(entry.report.corpus_archive_sha256, corpus.archive.sha256);
    assert.equal(entry.report.source_sha256, expectedSourceSha256);
    assert.equal(entry.report.runtime_build, variants[index].profile.runtime_build_info);
    entry.report.rows.forEach((row, rowIndex) => {
      for (const key of ['row_id', 'source', 'reference_ru', 'source_url', 'domain', 'topic']) assert.equal(row[key], expectedRows[rowIndex][key], `Changed corpus value: ${key}`);
    });
    const workspace = path.resolve(directory, entry.workspace);
    assert(workspace.startsWith(`${path.resolve(directory)}${path.sep}`), 'Variant workspace escaped report directory');
    const profileBytes = await fs.readFile(path.join(workspace, 'profile.json'));
    assert.equal(digest(profileBytes), entry.report.profile_sha256);
    assert.deepEqual(JSON.parse(profileBytes), variants[index].profile);
    for (const [file, sha] of [['source.srt', entry.report.source_sha256], ['candidate.ru.srt', entry.report.output_sha256], ['offline-reexport.ru.srt', entry.report.output_sha256]]) {
      assert.equal(digest(await fs.readFile(path.join(workspace, file))), sha, `Changed local artifact: ${file}`);
    }
    assert.deepEqual(await fs.readFile(path.join(workspace, 'reference.ru.srt')), buildSrt(expectedRows.map((row) => ({ source: row.reference_ru }))));
    const individual = JSON.parse(await fs.readFile(path.join(workspace, 'report.json')));
    assert.deepEqual(individual, entry.report, 'Combined and individual report differ');
  }
  console.log(`Verified ${comparison.total_variants} local reports and immutable file/profile hashes; quality remains unreviewed.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
