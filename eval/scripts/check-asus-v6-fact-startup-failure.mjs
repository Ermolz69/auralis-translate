import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const parent = path.join(root,
  '.cache/eval/commons-asus-v6-fact-model-screen-startup-check-v1');
const directory = (await fs.readFile(path.join(parent, 'latest.txt'), 'utf8')).trim();
assert.equal(path.dirname(directory), parent);
const report = JSON.parse(await fs.readFile(path.join(directory, 'report.json')));
const journal = await fs.readFile(path.join(directory, 'requests.jsonl'));
const harness = await fs.readFile(path.join(root,
  'eval/scripts/probe-asus-v6-fact-model-screen.mjs'));
assert.equal(report.harness_sha256,
  createHash('sha256').update(harness).digest('hex'));
assert.equal(report.id, 'commons-asus-v6-fact-model-screen-v1');
assert.equal(report.startup_check, true);
assert.equal(report.status, 'failed');
assert.equal(report.git_head, null);
assert.equal(report.planned_requests.length, 64);
assert.deepEqual(report.requests, []);
assert.deepEqual(report.resources, {});
assert.equal(report.failures.length, 1);
assert.equal(report.failures[0].message,
  'Error: simulated metadata failure before server start');
assert.equal(journal.length, 0);
assert.equal((await fs.readdir(directory)).filter(file => file.endsWith('-server.log')).length, 0);
console.log('ASUS fact-screen startup regression verified: metadata failure saved before any server or chat request.');
