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
const [baseBytes, planBytes, reportBytes, reviewBytes] =
  await Promise.all([
    read('eval/regressions/catalog-v58.json'),
    read('eval/experiments/2026-10-10-reg083-hall-referent-v4-plan.md'),
    read('eval/reports/2026-10-10-reg083-hall-v4.json'),
    read('eval/reports/2026-10-10-reg083-hall-v4-ai-review.json'),
  ]);
assert.equal(sha(baseBytes),
  '5a0e1f9fcbfb194e37e1ed65620a1b33ecf268cae47dfa5b42e7cce36f31cfed');
assert.equal(sha(planBytes),
  '309a97a59521b3c7c24e744640bd7add7f05d168006a8766355cd3c7b65899d2');
assert.equal(sha(reportBytes),
  '73fcf6706d96f7284a69598585973fa3cd0676c8ee70869609e65aefc707ddea');
assert.equal(sha(reviewBytes),
  '0b61204bf1c7a35e78b16f3383f93602e7084ebe78d0233b7534c24a25a797ef');
const base = JSON.parse(baseBytes);
const report = JSON.parse(reportBytes);
const review = JSON.parse(reviewBytes);
assert.equal(base.schema_version, 58);
assert.equal(base.entries.at(-1).id, 'REG-083');
assert.deepEqual(report.observations.source_trigger_ids, [24]);
assert.equal(report.observations.v4_new_warning_count, 1);
assert.equal(report.observations.product_rule_admitted, false);
assert.equal(review.machine_report_sha256, sha(reportBytes));
assert.deepEqual(review.warning_ids_reviewed, [24]);
assert.equal(review.human_bilingual_reviews, 0);
const evidence = 'eval/experiments/2026-10-10-reg083-hall-referent-v4-result.md';
await read(evidence);
const entries = structuredClone(base.entries);
const previous = entries.at(-1);
entries[entries.length - 1] = {
  ...previous,
  previous_evidence_record: previous.evidence_record,
  evidence_record: evidence,
  freeze_sha256: sha(planBytes),
  paired_machine_report_sha256: sha(reportBytes),
  ai_review_sha256: sha(reviewBytes),
  diagnostic_control_tests_passed: 10,
  control_model_runs: 0,
  product_rule_admitted: false,
  last_outcome: 'V4 evaluation-only warning catches the one exposed Hall-stick substitution in 268 aligned ASUS cues; ten deterministic controls pass, but no distinct natural trigger or human review supports product admission.',
};
const catalog = { schema_version: 59,
  catalog_id: 'zh-ru-development-regressions-v59',
  base_catalog_file: 'catalog-v58.json',
  base_catalog_sha256: sha(baseBytes), entries };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v59.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v59 ${write ? 'written' : 'verified'}: REG-083 diagnostic remains evaluation-only.`);
