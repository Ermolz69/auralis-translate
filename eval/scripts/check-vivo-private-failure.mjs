import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';
import { readRunSnapshot } from './cli-run-state.mjs';

const root = path.resolve('.');
const workspace = path.join(root, '.cache/eval/commons-vivo-full-7b-v1/run-zxrN7F');
const source = fs.readFileSync(path.join(root, '.cache/eval/commons-vivo-979826861/source.zh.srt'));
assert.equal(digest(source), '8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000');
const reportBytes = fs.readFileSync(path.join(workspace, 'report.json'));
assert.equal(digest(reportBytes), 'acce4016734648c500a4abeb5ae7619e138d1af46955c50232a39cb450ec59b2');
const report = JSON.parse(reportBytes);
assert.equal(report.experiment, 'commons-vivo-full-7b-v1');
assert.equal(report.status, 'failed');
assert.equal(report.source_cues, 467);
assert.equal(report.scene_map_sha256,
  'f066be41eaf9b1e7a303cd45823999a263f8f5be608db41b5754f59c2fd99ce7');
assert.equal(digest(fs.readFileSync(path.join(workspace, 'scene-map.json'))), report.scene_map_sha256);
assert.equal(report.profile_sha256,
  '9b34d86d3b0d872720ee729131efef99281e71a0000d202abea169d625a92e73');
assert.equal(report.cli_sha256,
  '82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d');
assert.equal(report.runtime_sha256,
  '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
assert.equal(report.model_sha256_verified_by_doctor,
  '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b');
assert.equal(report.requests.length, 831);
const chats = report.requests.filter(row => row.path === '/v1/chat/completions');
assert.equal(chats.length, 276);
const failed = chats.at(-1);
assert.equal(failed.request_sha256,
  '24b553c5217f75f55232adeb2b646acb3c865cfb834f972731dfba3b3960081d');
assert.equal(digest(Buffer.from(failed.raw_response)),
  'f0ed9595e8ce1a870411cd6ae895e8ca39d2cfcc0a3e725e88e8fdf6b52c3704');
assert.equal(digest(Buffer.from(failed.raw_candidate)),
  '7d9a8a36abfccde5c99186327d9af4e3748c78b711690ea713a25833d7cdc884');
assert.equal(JSON.parse(failed.raw_response).choices[0].finish_reason, 'stop');
assert.equal(failed.usage.prompt_tokens, 283);
assert.equal(failed.usage.completion_tokens, 63);
const decoded = JSON.parse(failed.raw_candidate).translations;
assert.equal(decoded.length, 1);
assert.equal(decoded[0].segment_id, 276);
assert.equal(decoded[0].line_index, 0);
assert(decoded[0].text.endsWith('」}]}'));
const sourceBlocks = source.toString('utf8').trimEnd().split(/\n\n+/u);
assert.equal(sourceBlocks.length, 467);
assert.equal(digest(Buffer.from(sourceBlocks.slice(274, 277).join('\n\n'))),
  'a15528dfcc697a537c9d1adaeebcedf7552a8a0df40e28cfcd3b75bcb44cd03a');
assert(!/[{}\[\]]/u.test(sourceBlocks[275]));
const runId = '58d6ae3d-ade0-4bcf-b375-640a2c27db0c';
const snapshot = readRunSnapshot(path.join(workspace, 'state/auralis-translate.sqlite'), runId);
assert(snapshot.run);
assert.equal(snapshot.checkpoints.length, 275);
assert(snapshot.checkpoints.every((row, index) => row.block_index === index));
assert.equal(snapshot.results.length, 0);
assert(!fs.existsSync(path.join(workspace, 'candidate.ru.srt')));
assert.match(report.failures.at(-1).message, /SRT target line violates supported text grammar/u);
console.log('Vivo private failure verified: 275/467 immutable checkpoints, malformed cue 276 rejected, zero results/output.');
