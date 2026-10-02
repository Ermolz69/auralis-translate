import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const pack = JSON.parse(await fs.readFile(path.join(root,
  'eval/regressions/reg-060-target-field-mismatch-v1.json')));
assert.equal(pack.id, 'REG-060');
const semanticPack = JSON.parse(await fs.readFile(path.join(root,
  'eval/regressions/v8-natural-7b-semantic-risk-v1.json')));
const authored = new Map([...semanticPack.related_controls,
  ...semanticPack.negative_controls].map(row => [row.id, row.source]));
const accepts = target => target.source_original === target.source_for_translation;
for (const row of pack.related_controls) assert(accepts(row));
for (const row of pack.negative_controls) assert(!accepts(row));

for (const [version, expectedMismatch, expectedSha] of [
  ['v1', true, pack.minimal_reproducer.private_v1_report_sha256],
  ['v2', false, pack.corrected_v2_private_report_sha256],
]) {
  const directory = version === 'v1' ?
    '.cache/eval/reg-058-paired-controls-v1/attempt-QdwzSQ' :
    '.cache/eval/reg-058-paired-controls-v2/attempt-3FxuHu';
  const reportBytes = await fs.readFile(path.join(root, directory, 'report.json'));
  assert.equal(digest(reportBytes), expectedSha);
  const report = JSON.parse(reportBytes);
  assert.equal(report.arms.length, 2);
  for (const arm of report.arms) {
    const entries = (await fs.readFile(path.join(root, directory, arm.id,
      'requests.jsonl'), 'utf8')).trim().split('\n').map(JSON.parse);
    assert.equal(entries.length, 12);
    for (const entry of entries) {
      const envelope = JSON.parse(entry.request.messages[0].content
        .split('Input JSON:\n')[1]);
      const target = envelope.target_slots[0];
      assert.equal(target.source_original, authored.get(entry.control_id));
      assert.equal(accepts(target), !expectedMismatch);
      if (version === 'v1' && arm.id === pack.minimal_reproducer.model_arm &&
          entry.control_id === pack.minimal_reproducer.control_id) {
        assert.equal(entry.request_sha256,
          pack.minimal_reproducer.request_sha256);
      }
    }
  }
}
console.log('REG-060: four minimal controls and 24 invalid/24 corrected real requests checked.');
