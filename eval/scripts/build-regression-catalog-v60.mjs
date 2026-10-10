import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv.length === 3 && process.argv[2] === '--write';
assert(process.argv.length === 2 || write);
const read = relative => fs.readFile(path.join(root, relative));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const [baseBytes, packBytes, planBytes, reportBytes] = await Promise.all([
  read('eval/regressions/catalog-v59.json'),
  read('eval/regressions/reg-084-youtube-caption-fetch-exit-v1.json'),
  read('eval/experiments/2026-10-10-youtube-vivo-caption-restoration-v2-plan.md'),
  read('eval/reports/2026-10-10-youtube-vivo-caption-restoration-v2.json'),
]);
assert.equal(sha(baseBytes),
  '7ae83cb5ea69ee812bacce9914d452e7faea4dce034a82ba29ecaf6f346b7ad7');
assert.equal(sha(packBytes),
  'aaf5b52ada73eaefa658d94b163b3773369acc87cc0260fc67a5943c1a89a201');
assert.equal(sha(planBytes),
  '74e3edb130ac5a89895f3f76f5aaae1c7885fd3aac63c51cd00c9bc452373c3e');
assert.equal(sha(reportBytes),
  'f11fbd64c634f1c814087ed5790258912d0e5b0aec54b62213a596f1f4012834');
const base = JSON.parse(baseBytes);
const pack = JSON.parse(packBytes);
const report = JSON.parse(reportBytes);
assert.equal(base.schema_version, 59);
assert.equal(base.entries.at(-1).id, 'REG-083');
assert.equal(pack.id, 'REG-084');
assert.equal(report.status, 'restored_exact_previous_youtube_bytes');
assert.equal(report.comparison.candidate_cues, 467);
assert.equal(report.comparison.previous_youtube_byte_identical, true);
assert.equal(report.source_admitted, false);
const evidence = 'eval/experiments/2026-10-10-youtube-vivo-caption-restoration-v2-result.md';
await read(evidence);
const entries = structuredClone(base.entries);
entries.push({ id: 'REG-084', source_family: pack.source_family,
  split: pack.split, category: 'youtube_caption_fetch_process_exit',
  profile_scope: pack.profile_scope,
  expected_invariant: pack.expected_invariant, severity: pack.severity,
  pack_file: 'reg-084-youtube-caption-fetch-exit-v1.json',
  pack_sha256: sha(packBytes), minimal_reproducer_count: 1,
  related_control_count: 5, negative_control_count: 2,
  evidence_record: evidence, freeze_sha256: sha(planBytes),
  paired_machine_report_sha256: sha(reportBytes),
  last_outcome: 'The only caption GET saved the exact 467-cue YouTube SRT but the acquisition task exited 9 after persistence; natural-return correction and six offline controls passed without a second network request.',
  network_retries: 0, product_rule_admitted: false });
const catalog = { schema_version: 60,
  catalog_id: 'zh-ru-development-regressions-v60',
  base_catalog_file: 'catalog-v59.json',
  base_catalog_sha256: sha(baseBytes), entries };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v60.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v60 ${write ? 'written' : 'verified'}: REG-084 source harness failure retained.`);
