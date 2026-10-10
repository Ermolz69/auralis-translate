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
const [baseBytes, packBytes, machineBytes, reviewBytes] =
  await Promise.all([
    read('eval/regressions/catalog-v60.json'),
    read('eval/regressions/reg-085-retrospective-context-tense-v1.json'),
    read('eval/reports/2026-10-10-official-reference-v2.json'),
    read('eval/reports/2026-10-10-official-reference-v2-ai-review.json'),
  ]);
assert.equal(sha(baseBytes),
  'e64b5aef5624e2e8079092e38200c13f5cf7c40e0f9ae3bc352711a9a006f48e');
assert.equal(sha(packBytes),
  'd89cc593114654ed5ebd6af4be5989b5df834142465e28c135277d217fed94e7');
assert.equal(sha(machineBytes),
  '3ae81fcf37ed49579c7c47be4f2184b9d355547e108b6b88295d12ec71f83859');
assert.equal(sha(reviewBytes),
  '23f779b8ab798a5648a12e54d506ef3108890ab7414ee70e04398ba715127f20');
const base = JSON.parse(baseBytes);
const pack = JSON.parse(packBytes);
const review = JSON.parse(reviewBytes);
assert.equal(base.schema_version, 60);
assert.equal(base.entries.at(-1).id, 'REG-084');
assert.equal(pack.id, 'REG-085');
assert.equal(pack.related_controls.length, 3);
assert.equal(pack.negative_controls.length, 3);
assert.equal(review.ai_major_errors, 1);
assert.equal(review.human_reviews_of_model_output, 0);
const evidence =
  'eval/experiments/2026-10-10-official-zh-ru-reference-v2-result.md';
await read(evidence);
const catalog = { schema_version: 61,
  catalog_id: 'zh-ru-development-regressions-v61',
  base_catalog_file: 'catalog-v60.json',
  base_catalog_sha256: sha(baseBytes),
  entries: [...base.entries, {
    id: 'REG-085', source_family: pack.source_family,
    split: pack.split,
    category: 'retrospective_section_action_recast_as_instruction',
    profile_scope: pack.profile_scope,
    expected_invariant: pack.expected_invariant,
    severity: 'major',
    pack_file: 'reg-085-retrospective-context-tense-v1.json',
    pack_sha256: sha(packBytes),
    minimal_reproducer_count: 1,
    related_control_count: 3,
    negative_control_count: 3,
    evidence_record: evidence,
    paired_machine_report_sha256: sha(machineBytes),
    ai_review_sha256: sha(reviewBytes),
    control_model_runs: 0,
    last_outcome: 'The complete-clause official reference screen leaves one AI-identified retrospective-to-prescriptive drift; v8 stays unchanged and six new controls remain unrun.',
  }] };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v61.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v61 ${write ? 'written' : 'verified'}: REG-085 open`);
