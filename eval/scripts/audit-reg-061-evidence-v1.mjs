import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256 } from './target-term-scope.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const record = process.argv[2] === '--record';
assert(process.argv.length === 2 || (process.argv.length === 3 && record));
const initial = '9340d922aa0d2d20189c8223d42a0b1dcc4eb7db';
const implementation = 'b26092fd6949c25e18765eba0349fd7ebebbce21';
const publication = '260452400b39b343efdba4e85fbf001f1f812d37';
const primary = { name: 'Ermolz', email: '00ermzahar@gmail.com' };
const read = file => fs.readFile(path.join(root, file));
const livePath = '.cache/eval/live-pages-check/attempt-9ec7d5fc-f165-4de6-b83d-470f9560b304/report.json';
const liveBytes = await read(livePath);
const live = JSON.parse(liveBytes);
const gitBytes = (...args) => execFileSync('git', args, { cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: live.max_bytes_per_page });
const git = (...args) => gitBytes(...args).toString('utf8').trimEnd();
const canonical = bytes => bytes.toString('utf8').replaceAll('\r\n', '\n');
const head = git('rev-parse', 'HEAD');
for (const commit of [implementation, publication]) git('merge-base', '--is-ancestor', commit, head);
const privateRoot = '.cache/eval/reg-061-target-terms-v1';
const attempts = (await fs.readdir(path.join(root, privateRoot))).filter(name => name.startsWith('attempt-'));
assert.equal(attempts.length, 1);
const attempt = `${privateRoot}/${attempts[0]}`;
const rawBytes = await read(`${attempt}/report.json`);
const raw = JSON.parse(rawBytes);
const freeze = JSON.parse(await read('eval/experiments/2026-10-03-reg-061-target-terms-v1-freeze.json'));
const reportBytes = await read('eval/reports/2026-10-03-reg-061-target-terms-v1.json');
const report = JSON.parse(reportBytes);
const review = JSON.parse(await read('eval/reports/2026-10-03-reg-061-target-terms-v1-ai-review.json'));
assert.equal(raw.code_commit, implementation);
const commitTime = Number(git('show', '-s', '--format=%ct', implementation)) * 1000;
assert(commitTime < Date.parse(raw.started_at), 'Plan/freeze commit must precede the attempt');
for (const file of [...Object.keys(freeze.sourceHashes),
  'eval/experiments/2026-10-03-reg-061-target-terms-v1-freeze.json']) {
  assert.equal(canonical(await read(file)), canonical(gitBytes('show', `${implementation}:${file}`)),
    `Frozen inference input differs from pre-inference commit: ${file}`);
}
assert.equal(report.private_report_sha256, sha256(rawBytes));
const journalBytes = await read(`${attempt}/7b/requests.jsonl`);
const journal = journalBytes.toString('utf8').trim().split('\n').map(JSON.parse);
assert.equal(journal.length, 30);
assert.equal(journal.filter(row => row.variant === 'baseline').length, 15);
assert.equal(journal.filter(row => row.variant === 'scoped').length, 15);
assert.equal(journal.reduce((sum, row) => sum + row.preflight.length, 0), 60);
assert.equal(raw.limits.retries, 0);
assert.equal(raw.checkpoints, 0);
assert.equal(raw.published_results, 0);
assert(raw.wall_elapsed_ms <= raw.limits.wall_ms);
for (const row of journal) {
  assert.equal(row.checkpoint_accepted, false);
  assert(row.chat.elapsed_ms <= raw.limits.per_chat_ms);
  assert(row.preflight.every(call => call.elapsed_ms <= raw.limits.per_preflight_ms));
  assert(row.usage.completion_tokens <= raw.limits.response_tokens);
  assert(row.prompt_tokens_preflight + raw.limits.response_tokens + raw.limits.safety_tokens
    <= raw.limits.context_tokens);
  assert(Date.parse(row.started_at) >= Date.parse(raw.started_at));
  assert(Date.parse(row.started_at) <= Date.parse(raw.finished_at));
}
const inventory = [];
async function listFiles(directory, prefix = '') {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    assert(!entry.isSymbolicLink(), 'Attempt files must not alias external artifacts');
    const relative = prefix + entry.name;
    if (entry.isDirectory()) await listFiles(path.join(directory, entry.name), relative + '/');
    else {
      assert(entry.isFile());
      const bytes = await fs.readFile(path.join(directory, entry.name));
      inventory.push({ file: relative, bytes: bytes.length, sha256: sha256(bytes) });
    }
  }
}
await listFiles(path.join(root, attempt));
inventory.sort((a, b) => a.file.localeCompare(b.file));
assert.deepEqual(inventory.map(row => row.file), ['7b/requests.jsonl', '7b/resources.jsonl',
  '7b/server.stderr.log', '7b/server.stdout.log', 'report.json']);
const resources = (await read(`${attempt}/7b/resources.jsonl`)).toString('utf8').trim().split('\n').map(JSON.parse);
assert.deepEqual(resources, raw.arms[0].resources.samples);
assert.equal(resources.length, 6);
assert(resources.every(row => row.errors.length === 0 && row.processes.length > 0
  && row.processes.every(process => Number.isFinite(process.CPU)
    && Number.isFinite(process.WorkingSet64) && Number.isFinite(process.PrivateMemorySize64))));
assert.equal(raw.observer_overhead_ms, null);
assert.equal(review.reviewer_type, 'AI_source_aware_not_independent_human');
assert.equal(review.private_report_sha256, sha256(rawBytes));
assert.equal(review.human_bilingual_review_count, 0);
assert.equal(report.decision, 'reject_keep_product_v8');
const scoped = review.rows.filter(row => row.variant === 'scoped');
assert.equal(scoped.filter(row => row.fact_verdict === 'pass').length, 12);
assert.equal(scoped.filter(row => row.fact_verdict === 'fail').length, 1);
assert.equal(scoped.filter(row => row.fact_verdict === 'needs_review').length, 2);
const sourceBytes = await read('.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt');
assert.equal(sha256(sourceBytes), freeze.identities.source_sha256);
const scopeFiles = git('diff', '--name-only', initial, head).split('\n').filter(Boolean);
assert(scopeFiles.every(file => !/^(crates|models|docs\/architecture)\//u.test(file)),
  'Scope includes a product or foreign architecture change');
assert.equal(git('diff', '--name-only', initial, head, '--',
  'eval/regressions/reg-061-term-hint-contamination-v1.json',
  'eval/regressions/reg-058-provisional-terms-controls-v1.json',
  'eval/experiments/2026-10-02-reg-058-provisional-terms-v1-plan.md',
  'eval/experiments/2026-10-02-reg-058-provisional-terms-v1-result.md'), '');
const commonGit = path.resolve(root, git('rev-parse', '--git-common-dir'));
const sharedRoot = path.dirname(commonGit);
const protectedBytes = await fs.readFile(path.join(sharedRoot,
  'docs/architecture/014-result-history-selection.md'));
assert.equal(sha256(protectedBytes), '28e1d12c1afb4f1640128a2183564f26e119797e9b7f187134f0fd4f2f215aec');
for (const field of ['user.name', 'user.email']) assert.equal(git('config', '--global', '--get', field),
  field.endsWith('name') ? primary.name : primary.email);
const commits = git('rev-list', '--reverse', `${initial}..${head}`).split('\n');
for (const commit of commits) {
  assert.equal(git('show', '-s', '--format=%an%n%ae%n%cn%n%ce', commit),
    [primary.name, primary.email, primary.name, primary.email].join('\n'));
}
assert.equal(live.revision, publication);
assert.equal(live.status, 'live_byte_identical');
assert.equal(live.pages.length, 2);
for (const page of live.pages) {
  assert.equal(page.http_status, 200);
  const bytes = await read(`site/${page.name}`);
  assert.equal(sha256(bytes), page.live_sha256);
  assert.equal(canonical(bytes), canonical(gitBytes('show', `HEAD:site/${page.name}`)));
}
const result = { schema_version: 1, id: 'reg-061-evidence-audit-v1',
  status: 'verified_rejection_branch_only', audited_at: new Date().toISOString(),
  audited_head: head, implementation_commit: implementation, publication_commit: publication,
  implementation_committed_at: new Date(commitTime).toISOString(), inference_started_at: raw.started_at,
  audit_script_sha256: sha256(await fs.readFile(fileURLToPath(import.meta.url))),
  prior_result_sha256: sha256(reportBytes), live_report_sha256: sha256(liveBytes),
  source_sha256: sha256(sourceBytes), protected_foreign_edit_sha256: sha256(protectedBytes),
  chat_count: 30, preflight_count: 60, model_attempt_count: 1,
  checkpoint_count: 0, published_subtitle_count: 0,
  inventory, scoped_ai_facts: { pass: 12, fail: 1, needs_review: 2 },
  human_bilingual_review_count: 0, product_changed: false, full_file_branch: 'forbidden_after_rejection',
  overall_goal: 'incomplete', release_05: 'incomplete', audio_gates: 'incomplete',
  scope_commits: commits, scope_files: scopeFiles,
  limitation: 'A self-audit of existing development evidence; it neither adds inference nor supplies independent language or listening review.' };
if (record) await fs.writeFile(path.join(root,
  'eval/reports/2026-10-03-reg-061-evidence-audit-v1.json'), `${JSON.stringify(result, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ status: result.status, audited_head: head,
  files: inventory.length, chats: 30, preflights: 60, source_sha256: result.source_sha256,
  decision: report.decision, goal: result.overall_goal }));
