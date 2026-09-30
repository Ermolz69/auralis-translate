import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { digest } from './flores-file-fixture.mjs';
import { assertSavedPrefix, readRunSnapshot } from './cli-run-state.mjs';

const root = path.resolve('.');
const prior = path.join(root, '.cache/eval/commons-asus-full-7b-v1/run-nCoZTy');
const copied = path.join(root, '.cache/eval/commons-asus-full-7b-resume-v1/run-3viEKO');
const runId = 'bf1e6130-6674-4538-ba9f-6243bc164760';
const priorReport = fs.readFileSync(path.join(prior, 'report.json'));
assert.equal(digest(priorReport), 'd86f4264ae1c65f3508c3c8539cdcee3fd4fcae9de1fbc14ee0d83e02bc216ba');
const reportBytes = fs.readFileSync(path.join(copied, 'report.json'));
assert.equal(digest(reportBytes), '646d7e6ff5d83c5afa097766db52c267e34d7800c355ff192f7364f01bcb8d7d');
const report = JSON.parse(reportBytes);
assert.equal(report.experiment, 'commons-asus-full-7b-resume-v1');
assert.equal(report.status, 'failed');
assert.equal(report.revision, 'ddd4528f2903dcaf170ea93211c0f98a9c2a1954');
assert.equal(report.resume_of.failed_report_sha256, digest(priorReport));
assert.equal(report.resume_of.saved_blocks, 226);
assert.equal(report.resume_of.copied_state_db_sha256,
  '5251f0900da2858e9c51568d7143c4a3e2b23544949378ce011ba6029119c30a');
assert.equal(digest(fs.readFileSync(path.join(prior, 'state/auralis-translate.sqlite'))),
  report.resume_of.copied_state_db_sha256);
assert.equal(report.profile_sha256,
  '9b34d86d3b0d872720ee729131efef99281e71a0000d202abea169d625a92e73');
assert.equal(report.cli_sha256,
  '82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d');
assert.equal(report.runtime_sha256,
  '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
assert.equal(report.model_sha256_verified_by_doctor,
  '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b');
assert.equal(report.requests.length, 6);
const chats = report.requests.filter(row => row.path === '/v1/chat/completions');
assert.equal(chats.length, 1);
const first = JSON.parse(priorReport).requests.filter(row => row.path === '/v1/chat/completions').at(-1);
const repeated = chats[0];
assert.equal(repeated.request_sha256, first.request_sha256);
assert.equal(digest(Buffer.from(repeated.raw_response)),
  '52d0e4dd32a206729e540eb6be913cff10404bea0b34b3bfed1eec553b5402c6');
assert.equal(digest(Buffer.from(repeated.raw_candidate)),
  '68448035d4a6a70862ef4d88e6899b47445905fc1fb995efd3b146190a6e6ab1');
assert.notEqual(repeated.raw_candidate, first.raw_candidate);
assert.equal(JSON.parse(repeated.raw_response).choices[0].finish_reason, 'stop');
const [target] = JSON.parse(repeated.raw_candidate).translations;
assert.equal(target.segment_id, 227);
assert.equal(target.line_index, 0);
assert(target.text.endsWith('」}]}'));
const before = readRunSnapshot(path.join(prior, 'state/auralis-translate.sqlite'), runId);
const after = readRunSnapshot(path.join(copied, 'state/auralis-translate.sqlite'), runId);
assertSavedPrefix(before, after);
assert.equal(before.checkpoints.length, 226);
assert.equal(after.checkpoints.length, 226);
assert.equal(after.attempts.length, 2);
assert.equal(after.results.length, 0);
assert.equal(digest(fs.readFileSync(path.join(copied, 'state/auralis-translate.sqlite'))),
  'b8c0b64f6e68687766fb06189d0796afe0cd9343a1b9de8b901ecc8e8a770579');
assert(!fs.existsSync(path.join(copied, 'candidate.ru.srt')));
assert.match(report.failures.at(-1).message, /SRT target line violates supported text grammar/u);
console.log('ASUS copied-state failure verified: same request, changed raw reply, same JSON-tail class, 226 checkpoints, zero results/output.');
