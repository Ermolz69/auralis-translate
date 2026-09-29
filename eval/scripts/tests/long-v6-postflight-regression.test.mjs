import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const pack = JSON.parse(fs.readFileSync(path.join(root,
  'eval/regressions/long-v6-postflight-tdz-v1.json')));
const packV2 = JSON.parse(fs.readFileSync(path.join(root,
  'eval/regressions/long-v6-postflight-tdz-v2.json')));

test('REG-008 preserves the failed postflight and completed-but-unverified output identity', () => {
  assert.equal(pack.id, 'REG-008');
  assert.equal(pack.source_commit, '7729599');
  assert.equal(pack.observed_checkpoints_before_postflight, 1024);
  assert.equal(pack.observed_results_before_postflight, 1);
  assert.equal(pack.observed_output_sha256,
    'cc2f4b3c88433cf59223bb35cfc95cdfeeed0c079c068106e7ef485369bd2e2b');
  const failure = fs.readFileSync(path.join(root, pack.failure_report));
  assert.equal(createHash('sha256').update(failure).digest('hex'), pack.failure_report_sha256);
  assert.match(JSON.parse(failure).error, /ReferenceError: Cannot access 'process' before initialization/u);
  assert.match(pack.minimal_reproduction, /const process = startProcess\([^\n]*process\.env/u);
});

test('REG-008 keeps success, nonzero exit and timeout controls distinct', () => {
  assert.equal(pack.related_controls.length, 3);
  assert(pack.related_controls.some(control => control.includes('environment')));
  assert(pack.related_controls.some(control => control.includes('nonzero')));
  assert(pack.related_controls.some(control => control.includes('timeout')));
  assert.equal(pack.release_gate, 'open');
});

test('REG-008 v2 retains v1 evidence and declares the omitted-environment negative control', () => {
  const originalBytes = fs.readFileSync(path.join(root,
    'eval/regressions/long-v6-postflight-tdz-v1.json'));
  assert.equal(packV2.source_pack_v1_sha256,
    createHash('sha256').update(originalBytes).digest('hex'));
  const { source_pack_v1_sha256, negative_control, ...retained } = packV2;
  assert.deepEqual({ ...retained, schema_version: 1 }, pack);
  assert.match(negative_control, /before spawning/u);
});
