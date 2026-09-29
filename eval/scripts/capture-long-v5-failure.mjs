import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';
import { digest } from './flores-file-fixture.mjs';
import { assertSavedPrefix, readRunSnapshot } from './cli-run-state.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [workspaceArg, stem] = process.argv.slice(2);
assert(workspaceArg && stem && /^[a-z0-9-]+$/u.test(stem));
assert.equal(stem, '2026-09-29-long-v5-scene-failure');
const workspace = path.resolve(workspaceArg);
assert(workspace.startsWith(path.join(root, '.cache/eval/long-v5-scene-runs') + path.sep));
const outputDir = path.join(root, 'eval/reports');
const source = await fs.readFile(path.join(workspace, 'source.srt'));
const profile = await fs.readFile(path.join(workspace, 'profile.json'));
const sceneMap = await fs.readFile(path.join(workspace, 'scene-map.json'));
const fixture = await fs.readFile(path.join(path.dirname(workspace), 'fixture-manifest.json'));
const failure = JSON.parse(await fs.readFile(path.join(workspace, 'failure.json')));
const interrupted = JSON.parse(await fs.readFile(path.join(workspace, 'interrupted-snapshot.json')));
interrupted.checkpoints = interrupted.checkpoints.map((row) => Object.assign(Object.create(null), row));
const dbPath = path.join(workspace, 'state/auralis-translate.sqlite');
const snapshot = readRunSnapshot(dbPath, interrupted.run.run_id);
assert.equal(snapshot.run.run_id, '75a482ee-3aee-41e1-b460-af192026f209');
assert.equal(snapshot.run.state, 'failed');
assert.equal(snapshot.results.length, 0);
assert.equal((await fs.stat(path.join(workspace, 'candidate.ru.srt')).catch(() => null)), null);
assert.deepEqual(await fs.readFile(snapshot.source.source_locator), source);
assertSavedPrefix(interrupted, snapshot);
const db = new DatabaseSync(dbPath, { readOnly: true });
const requests = db.prepare('SELECT * FROM inference_requests WHERE run_id = ? ORDER BY sequence').all(snapshot.run.run_id)
  .map((row) => ({ ...row, rendered_request: Buffer.from(row.rendered_request).toString('utf8'), raw_response: row.raw_response === null ? null : Buffer.from(row.raw_response).toString('utf8') }));
db.close();
const rejected = requests.filter((row) => row.outcome === 'invalid_candidate');
assert.equal(rejected.length, 1);
const last = rejected[0];
assert.equal(last.request_kind, 'chat_completion');
const prompt = JSON.parse(last.rendered_request).messages[0].content;
const envelope = JSON.parse(prompt.split('Input JSON:\n')[1]);
const response = JSON.parse(last.raw_response);
const candidate = JSON.parse(response.choices[0].message.content);
assert.equal(envelope.target_slots.length, 1);
assert.equal(candidate.translations.length, 1);
assert.notEqual(candidate.translations[0].segment_id, envelope.target_slots[0].segment_id);
const journalBytes = Buffer.from(`${JSON.stringify({ schema_version: 1, run_id: snapshot.run.run_id, requests }, null, 2)}\n`);
const journalCompressed = gzipSync(journalBytes, { mtime: 0 });
const report = {
  schema_version: 1,
  experiment: 'long-v5-scene-1024-v1',
  captured_at: new Date().toISOString(),
  outcome: 'failed_invalid_candidate',
  code_commit: '88858adb30f6a5d7869a20ace58817dae21067f9',
  task: 'task eval:cli:long:v5:scene',
  run_id: snapshot.run.run_id,
  source_sha256: digest(source),
  fixture_manifest_sha256: digest(fixture),
  scene_map_sha256: digest(sceneMap),
  profile_sha256: digest(profile),
  source_cues: 1024,
  text_slots: 1280,
  planned_blocks: JSON.parse(snapshot.run.block_plan_json).length,
  saved_blocks: snapshot.checkpoints.length,
  interrupted_blocks: interrupted.checkpoints.length,
  saved_prefix_preserved: true,
  partial_result_count: snapshot.results.length,
  partial_output_present: false,
  attempts: snapshot.attempts,
  request_count: requests.length,
  requests_by_kind_outcome: Object.entries(Object.groupBy(requests, (row) => `${row.request_kind}:${row.outcome}`)).map(([key, rows]) => ({ key, count: rows.length })),
  failed_slot: envelope.target_slots[0],
  supplied_context: envelope.source_context,
  raw_response: last.raw_response,
  candidate: response.choices[0].message.content,
  failing_request: { sequence: last.sequence, request_id: last.request_id, outcome: last.outcome, error_detail: last.error_detail, prompt_tokens: last.prompt_tokens, completion_tokens: last.completion_tokens, elapsed_ms: last.elapsed_ms },
  journal_uncompressed_sha256: digest(journalBytes),
  journal_gzip_sha256: digest(journalCompressed),
  journal_file: `${stem}-journal.json.gz`,
  resources_sha256: digest(await fs.readFile(path.join(workspace, 'resources.jsonl'))),
  failure_sha256: digest(await fs.readFile(path.join(workspace, 'failure.json'))),
  subtitle_holdout: false,
  bilingual_reviewed: false,
  quality_verdict: 'unreviewed',
};
await fs.writeFile(path.join(outputDir, `${stem}-journal.json.gz`), journalCompressed, { flag: 'wx' });
await fs.writeFile(path.join(outputDir, `${stem}.json`), `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
console.log(`Retained ${requests.length} requests, ${snapshot.checkpoints.length} checkpoints, no result; rejected slot ${envelope.target_slots[0].segment_id} -> ${candidate.translations[0].segment_id}`);
