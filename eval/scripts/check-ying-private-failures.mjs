import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { digest } from './flores-file-fixture.mjs';

const root = path.resolve('.');
const firstDir = path.join(root, '.cache/eval/commons-ying-full-7b-v1/run-z2fnYf');
const preflightDir = path.join(root, '.cache/eval/commons-ying-full-7b-resume-v1/run-pCIkzN');
const secondDir = path.join(root, '.cache/eval/commons-ying-full-7b-resume-v1/run-Tw8zrq');
const load = (directory, sha256) => {
  const bytes = fs.readFileSync(path.join(directory, 'report.json'));
  assert.equal(digest(bytes), sha256);
  return JSON.parse(bytes);
};
const countState = directory => {
  const db = new DatabaseSync(path.join(directory, 'state/auralis-translate.sqlite'), { readOnly: true });
  try {
    return {
      checkpoints: db.prepare('SELECT count(*) AS n FROM block_checkpoints').get().n,
      results: db.prepare('SELECT count(*) AS n FROM results').get().n,
      cue27: db.prepare('SELECT accepted_json FROM block_checkpoints WHERE block_index = 26').get()?.accepted_json,
    };
  } finally { db.close(); }
};

const first = load(firstDir, 'f08a248dac388a8d327e3c2c714c1b61fcba1f70b64b3be65a7150f07ade706c');
assert.equal(first.status, 'failed');
assert.equal(first.source_sha256, '505913bd7046b28c873307562a55d567043f8703bc00375c3485853b87c420d9');
const firstChats = first.requests.filter(row => row.path === '/v1/chat/completions');
assert.equal(firstChats.length, 27);
assert.equal(first.requests.length, 84);
const length = firstChats.at(-1);
assert.equal(length.request_sha256, 'a558c84320c33afe8eb9f7e445cfdb51fc0d2d63652b05c9dc3c20df74caa6b2');
assert.equal(digest(Buffer.from(length.raw_response)), 'd00b4873dba06a50233405fab8f72f21dad71c3720c3429af214cb30f3ba0c75');
assert.equal(JSON.parse(length.raw_response).choices[0].finish_reason, 'length');
assert.equal(length.usage.completion_tokens, 256);
assert.equal(length.request.max_tokens, 256);
assert.deepEqual(countState(firstDir), { checkpoints: 26, results: 0, cue27: undefined });

const preflight = load(preflightDir, 'ae3b841d33104ac5ee88ddd20bb91a76edf5e936f5203dda8539f3afe011c0c2');
assert.equal(preflight.status, 'failed');
assert.equal(preflight.requests.length, 0);
assert.match(preflight.failures.at(-1).message, /managed source lies outside the state directory/u);
assert.equal(countState(preflightDir).checkpoints, 26);

const second = load(secondDir, 'ceef66dc7fc78d059583b5604f01b6d0843d1d4fb1023327f313d6d27272d295');
assert.equal(second.status, 'failed');
assert.equal(second.resume_of.saved_blocks, 26);
assert.equal(second.resume_of.copied_source_relocated, true);
assert.equal(second.requests.length, 204);
const chats = second.requests.filter(row => row.path === '/v1/chat/completions');
assert.equal(chats.length, 67);
assert.equal(chats[0].request_sha256, length.request_sha256);
assert.equal(digest(Buffer.from(chats[0].raw_response)), '6b53cd7ace43490bf6b3fb428dfe9bcc721027a721c6c478e9af2f2a74b6e88e');
assert.equal(JSON.parse(chats[0].raw_response).choices[0].finish_reason, 'stop');
assert.match(second.failures.at(-1).message, /SRT error UnsupportedMarkup/u);
const state = countState(secondDir);
assert.equal(state.checkpoints, 93);
assert.equal(state.results, 0);
assert.equal(JSON.parse(state.cue27)[0].id, 27);
assert.match(JSON.parse(state.cue27)[0].lines[0], /\}\]\}\{\}.*Wait, the JSON structure should be \{/u);
assert(!fs.existsSync(path.join(secondDir, 'candidate.ru.srt')));
assert.equal(digest(fs.readFileSync(path.join(firstDir, 'state/auralis-translate.sqlite'))),
  second.resume_of.copied_state_db_sha256);
assert.equal(digest(fs.readFileSync(path.join(root, '.cache/eval/commons-ying-1238607314/source.zh.srt'))), first.source_sha256);
console.log('Ying private failures verified: 26/93 safe prefix, zero preflight inference, 93 unrenderable checkpoints, zero published results.');
