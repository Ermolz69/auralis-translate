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
const [baseBytes, machineBytes, reviewBytes] = await Promise.all([
  read('eval/regressions/catalog-v61.json'),
  read('eval/reports/2026-10-10-reg085-temporal-controls-v1.json'),
  read('eval/reports/2026-10-10-reg085-temporal-controls-v1-ai-review.json'),
]);
assert.equal(sha(baseBytes),
  'f13b20835a203880853b297944d63d4895dc5c0bf74348d1fc4a7bb589700823');
assert.equal(sha(machineBytes),
  'f3b72032716dee53dd72bb5212168efa5157551797f6cd1585243e1a42c65728');
assert.equal(sha(reviewBytes),
  '2cefc5d00a73a215cb11c0d517377d4f74bf77274bfa0007f2501cadaf76099e');
const base = JSON.parse(baseBytes);
const machine = JSON.parse(machineBytes);
const review = JSON.parse(reviewBytes);
assert.equal(base.schema_version, 61);
assert.equal(base.entries.at(-1).id, 'REG-085');
assert.equal(base.entries.at(-1).control_model_runs, 0);
assert.equal(machine.complete_answers, 6);
assert.equal(review.confirmed_new_major_errors, 0);
assert.equal(review.uncertain_cases, 1);
assert.equal(review.human_reviews_of_model_output, 0);
const evidence =
  'eval/experiments/2026-10-10-reg085-temporal-controls-v1-result.md';
await read(evidence);
const catalog = { schema_version: 62,
  catalog_id: 'zh-ru-development-regressions-v62',
  base_catalog_file: 'catalog-v61.json',
  base_catalog_sha256: sha(baseBytes),
  entries: [...base.entries.slice(0, -1), {
    ...base.entries.at(-1),
    control_model_runs: 6,
    control_machine_report_sha256: sha(machineBytes),
    control_ai_review_sha256: sha(reviewBytes),
    control_evidence_record: evidence,
    last_outcome: 'Six authored controls ran once on unchanged 7B/v8: five clear temporal matches and one uncertain heading-only case in AI review. The earlier official-reference error remains; no product fix or subtitle gate admission.',
  }] };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v62.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v62 ${write ? 'written' : 'verified'}: REG-085 controls retained`);
