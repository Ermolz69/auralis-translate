import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';
import { readRunSnapshot } from './cli-run-state.mjs';

const root = path.resolve('.');
const workspace = path.join(root, '.cache/eval/commons-asus-full-7b-v1/run-nCoZTy');
const source = fs.readFileSync(path.join(root, '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt'));
assert.equal(digest(source), '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b');
const reportBytes = fs.readFileSync(path.join(workspace, 'report.json'));
assert.equal(digest(reportBytes), 'd86f4264ae1c65f3508c3c8539cdcee3fd4fcae9de1fbc14ee0d83e02bc216ba');
const report = JSON.parse(reportBytes);
assert.equal(report.experiment, 'commons-asus-full-7b-v1');
assert.equal(report.status, 'failed');
assert.equal(report.revision, '05ff1ccdc4cb9014da884ad1d3aaecb2a15f23d6');
assert.equal(report.source_cues, 268);
assert.equal(report.scene_map_sha256,
  '189da2212f42cfe16373db7d54d1985bcae1d56e7601fb918a47c05a4d8851e7');
assert.equal(digest(fs.readFileSync(path.join(workspace, 'scene-map.json'))), report.scene_map_sha256);
assert.equal(report.profile_sha256,
  '9b34d86d3b0d872720ee729131efef99281e71a0000d202abea169d625a92e73');
assert.equal(report.cli_sha256,
  '82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d');
assert.equal(report.runtime_sha256,
  '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
assert.equal(report.model_sha256_verified_by_doctor,
  '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b');
assert.equal(report.requests.length, 684);
const chats = report.requests.filter(row => row.path === '/v1/chat/completions');
assert.equal(chats.length, 227);
const failed = chats.at(-1);
assert.equal(failed.request_sha256,
  '945dda8849ffbfd948794a01311e94274e4f00b388a214025dfb709c7e226848');
assert.equal(digest(Buffer.from(failed.raw_response)),
  'fe6162424bae4ec19511a173dafb0cdef7f6e3bffd37497609313040176185a6');
assert.equal(digest(Buffer.from(failed.raw_candidate)),
  '268abfbddfb6f202b44a33d5022c43b42d74110ff5faf38d9564bbc113770167');
assert.equal(JSON.parse(failed.raw_response).choices[0].finish_reason, 'stop');
assert.equal(failed.usage.prompt_tokens, 305);
assert.equal(failed.usage.completion_tokens, 69);
const [target] = JSON.parse(failed.raw_candidate).translations;
assert.equal(target.segment_id, 227);
assert.equal(target.line_index, 0);
assert(target.text.endsWith('」}]}'));
const blocks = source.toString('utf8').trimEnd().split(/\n\n+/u);
assert.equal(blocks.length, 268);
assert.equal(digest(Buffer.from(blocks.slice(225, 228).join('\n\n'))),
  '9fef4c9d85cbb607efac39f0e123070ea0b1c27c7d1f2cd4404156a6b09bc14a');
assert(!/[{}\[\]]/u.test(blocks[226]));
const snapshot = readRunSnapshot(path.join(workspace, 'state/auralis-translate.sqlite'),
  'bf1e6130-6674-4538-ba9f-6243bc164760');
assert(snapshot.run);
assert.equal(snapshot.checkpoints.length, 226);
assert(snapshot.checkpoints.every((row, index) => row.block_index === index));
assert.equal(snapshot.attempts.length, 1);
assert.equal(snapshot.results.length, 0);
assert.equal(digest(fs.readFileSync(path.join(workspace, 'state/auralis-translate.sqlite'))),
  '5251f0900da2858e9c51568d7143c4a3e2b23544949378ce011ba6029119c30a');
assert(!fs.existsSync(path.join(workspace, 'candidate.ru.srt')));
assert.match(report.failures.at(-1).message, /SRT target line violates supported text grammar/u);
console.log('ASUS private failure verified: 226/268 immutable checkpoints, cue 227 rejected, zero results/output.');
