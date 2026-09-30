import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('.');
const source = path.join(root, '.cache/eval/asus-v6-token-budget-audit-v1/report.json');
const target = path.join(root, 'eval/reports/asus-v6-token-budget-audit-v1.json');
const bytes = fs.readFileSync(source);
const sha256 = createHash('sha256').update(bytes).digest('hex');
assert.equal(sha256, 'fd992a84395c1484744a1e9e5a87043b17435728c094089f746a6931c7c6c1b0');
const report = JSON.parse(bytes);
assert.equal(report.id, 'asus-v6-rendered-token-audit-v1');
assert.equal(report.cue_count, 268);
assert.equal(report.model_requests, 0);
assert.equal(report.prompt_total_tokens, 73766);
assert.equal(report.completion_total_tokens, 12155);
assert.deepEqual(report.prompt_max_cue_ids, [81]);
assert.deepEqual(report.boundary_rows.map(row => row.cue_id), [1, 2, 133, 134, 267, 268]);
assert(!Object.keys(report).some(key => /source_text|translation|raw_response|candidate/u.test(key)));
if (fs.existsSync(target)) {
  assert.deepEqual(fs.readFileSync(target), bytes, 'existing public summary changed');
} else {
  fs.writeFileSync(target, bytes, { flag: 'wx' });
}
console.log(`Public source-free ASUS token summary verified: ${sha256}`);
