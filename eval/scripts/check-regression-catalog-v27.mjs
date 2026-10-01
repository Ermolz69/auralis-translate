import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { readRunSnapshot } from './cli-run-state.mjs';

const root = path.resolve('.');
const directory = path.join(root, 'eval/regressions');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const catalog = JSON.parse(fs.readFileSync(path.join(directory, 'catalog-v27.json')));
assert.equal(catalog.schema_version, 27);
assert.equal(catalog.catalog_id, 'zh-ru-development-regressions-v27');
assert.equal(sha(fs.readFileSync(path.join(directory, catalog.base_catalog_file))),
  catalog.base_catalog_sha256);
assert.deepEqual(catalog.entries.map(row => row.id), ['REG-043']);
const entry = catalog.entries[0];
const packBytes = fs.readFileSync(path.join(directory, entry.pack_file));
assert.equal(sha(packBytes), entry.pack_sha256);
const pack = JSON.parse(packBytes);
for (const field of ['id', 'severity', 'source_family', 'split', 'expected_invariant'])
  assert.equal(pack[field], entry[field]);
assert.equal(pack.related_controls.length, entry.related_control_count);
assert.equal(pack.negative_controls.length, entry.negative_control_count);
assert.equal(new Set([...pack.related_controls, ...pack.negative_controls]
  .map(row => row.id)).size, 7);
assert.equal(pack.control_model_runs, 0);
assert.equal(pack.human_review, 'missing');
assert.equal(pack.release_gate, 'open');
assert(fs.existsSync(path.join(root, entry.evidence_record)));
assert(fs.existsSync(path.join(root, pack.contract_test)));
const source = fs.readFileSync(path.join(root, '.cache/eval/commons-sethlui-derived-v1/source.zh.srt'));
const reproducer = pack.private_reproducer;
assert.equal(sha(source), reproducer.source_sha256);
const sourceLine = source.toString('utf8').trimEnd()
  .split(/\r?\n\r?\n+/u)[reproducer.focus_cue - 1].split(/\r?\n/u)[2];
assert.equal(sha(Buffer.from(sourceLine)), reproducer.source_text_sha256);
const workspace = path.join(root, '.cache/eval/commons-sethlui-json-tail-retry-7b-v1/run-VmeFjB');
const reportBytes = fs.readFileSync(path.join(workspace, 'report.json'));
assert.equal(sha(reportBytes), reproducer.report_sha256);
const report = JSON.parse(reportBytes);
assert.equal(report.run_id, reproducer.run_id);
assert.equal(report.profile_sha256, pack.v1_profile_sha256);
const failed = report.requests.filter(row => row.path === '/v1/chat/completions').at(-1);
assert.equal(failed.request_sha256, reproducer.request_sha256);
assert.equal(sha(Buffer.from(failed.raw_candidate)), reproducer.raw_candidate_sha256);
assert.equal(JSON.parse(failed.raw_response).choices[0].finish_reason, reproducer.finish_reason);
assert.equal(failed.usage.completion_tokens, reproducer.completion_tokens);
const state = path.join(workspace, 'state/auralis-translate.sqlite');
assert.equal(sha(fs.readFileSync(state)), reproducer.state_sha256);
const snapshot = readRunSnapshot(state, reproducer.run_id);
assert.equal(snapshot.checkpoints.length, reproducer.saved_checkpoints);
assert.equal(snapshot.results.length, reproducer.complete_results);
assert(!fs.existsSync(path.join(workspace, 'candidate.ru.srt')));
assert.equal(sha(fs.readFileSync(path.join(root,
  'models/manifests/hy_mt2_7b_q4_k_m.context_v6_slot_retry_tail_length.experimental.json'))),
pack.v2_profile_sha256);
console.log('REG-043 pinned: raw length-limited wrapper loop, 61 durable checkpoints, no output, three related and four negative contract controls.');
