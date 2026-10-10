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
const [baseBytes, planBytes, reportBytes, reviewBytes, packBytes] =
  await Promise.all([
    read('eval/regressions/catalog-v57.json'),
    read('eval/experiments/2026-10-10-asus-source-relations-v3-plan.md'),
    read('eval/reports/2026-10-10-asus-source-relations-v3.json'),
    read('eval/reports/2026-10-10-asus-source-relations-v3-ai-review.json'),
    read('eval/regressions/reg-083-asus-hall-stick-substitution-v1.json'),
  ]);
assert.equal(sha(baseBytes),
  '8ec4426556630e447a78c151c5619556f6701acd635ae7ee0a7d6f6ba4add146');
assert.equal(sha(planBytes),
  '22b54d8a59a9d2a634274cd721e8581bea074caa70df7102b49bde2521760d0f');
const base = JSON.parse(baseBytes);
const report = JSON.parse(reportBytes);
const review = JSON.parse(reviewBytes);
const pack = JSON.parse(packBytes);
assert.equal(base.schema_version, 57);
assert.equal(base.entries.at(-1).id, 'REG-082');
assert.equal(report.observations.source_cues, 268);
assert.equal(report.observations.warning_count, 0);
assert.equal(review.machine_report_sha256, sha(reportBytes));
assert.equal(review.human_bilingual_reviews, 0);
assert.equal(review.cases[0].ai_judgment,
  'major_technical_term_substitution');
assert.equal(pack.id, 'REG-083');
assert.equal(pack.machine_report_sha256, sha(reportBytes));
assert.equal(pack.ai_review_sha256, sha(reviewBytes));
assert.equal(pack.related_controls.length, 3);
assert.equal(pack.negative_controls.length, 3);
assert.equal(pack.control_model_runs, 0);
const evidence = 'eval/experiments/2026-10-10-asus-source-relations-v3-result.md';
await read(evidence);
const catalog = { schema_version: 58,
  catalog_id: 'zh-ru-development-regressions-v58',
  base_catalog_file: 'catalog-v57.json',
  base_catalog_sha256: sha(baseBytes),
  entries: [...base.entries, {
    id: pack.id,
    source_family: pack.source_family,
    split: pack.split,
    category: 'hall_joystick_technical_referent_substitution',
    profile_scope: pack.profile_scope,
    expected_invariant: pack.expected_invariant,
    severity: pack.severity,
    pack_file: 'reg-083-asus-hall-stick-substitution-v1.json',
    pack_sha256: sha(packBytes),
    minimal_reproducer_count: 1,
    related_control_count: pack.related_controls.length,
    negative_control_count: pack.negative_controls.length,
    evidence_record: evidence,
    freeze_sha256: sha(planBytes),
    paired_machine_report_sha256: sha(reportBytes),
    ai_review_sha256: sha(reviewBytes),
    last_outcome: 'V3 emitted no warning on 268 aligned ASUS cues; AI triage found a Hall-stick technical substitution at cue 24; rule not admitted.',
  }] };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v58.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v58 ${write ? 'written' : 'verified'}: REG-083 retained; v3 not admitted.`);
