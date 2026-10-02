import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv[2];
assert.equal(process.argv.length, 3);
assert(['copy-resume', 'single-target'].includes(mode));
const parent = path.join(root, '.cache/eval',
  mode === 'copy-resume' ? 'v8-asus-copy-resume-v1' : 'v8-asus-single-target-v1');
const attempts = (await fs.readdir(parent).catch(error => {
  if (error.code === 'ENOENT') return [];
  throw error;
})).filter(name => name.startsWith('attempt-'));
assert(mode === 'copy-resume' ? attempts.length <= 1 : attempts.length === 0,
  `${mode} frozen attempt budget is exhausted; retain old traces and write a new plan`);
if (mode === 'copy-resume' && attempts.length === 1) {
  assert.equal(attempts[0], 'attempt-SRzHv4');
  const prior = JSON.parse(await fs.readFile(path.join(parent,
    'attempt-SRzHv4/report.json')));
  assert.equal(prior.status, 'failed');
  assert.deepEqual(prior.arms, []);
  assert.deepEqual(prior.errors, ['Error: spawn EPERM']);
}
console.log(`${mode}: frozen experiment may start its one model attempt`);
