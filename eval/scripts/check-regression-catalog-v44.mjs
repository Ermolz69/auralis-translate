import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = file => fs.readFile(path.join(root, file));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

const termBytes = await read('eval/regressions/catalog-v43.json');
const termCatalog = JSON.parse(termBytes);
assert.equal(termCatalog.schema_version, 43);
assert.deepEqual(termCatalog.entries.map(entry => entry.id), ['REG-062']);

const base = JSON.parse(await read('eval/regressions/catalog-v42.json'));
const oldName = base.entries.find(entry => entry.id === 'REG-063');
assert(oldName);
const packBytes = await read('eval/regressions/reg-063-name-proposal-neighbor-action-v2.json');
const pack = JSON.parse(packBytes);
const traceBytes = await read('eval/reports/2026-10-03-name-action-trace-v1.json');
assert.equal(pack.schema_version, 2);
assert.equal(pack.id, 'REG-063');
assert.equal(pack.trace_sha256, hash(traceBytes));
assert.equal(pack.original_pack_sha256,
  hash(await read('eval/regressions/reg-063-name-proposal-neighbor-action-v1.json')));
assert.equal(pack.admission_controls.length, 20);
assert(pack.admission_controls.every(control => control.model_runs === 0));

const reportBytes = await read('eval/reports/2026-10-03-name-action-admission-v1.json');
const report = JSON.parse(reportBytes);
const review = JSON.parse(await read('eval/reports/2026-10-03-name-action-admission-v1-ai-review.json'));
assert.equal(review.report_sha256, hash(reportBytes));
assert.equal(report.new_chat_calls, 0);
assert.equal(report.decision, 'reject_quality_advancement_keep_v8');
assert.equal(review.proposal_rejections, 33);
assert.equal(review.human_review_count, 0);

const nameEntry = {
  ...oldName,
  profile_scope: pack.profile_scope,
  pack_file: 'reg-063-name-proposal-neighbor-action-v2.json',
  pack_sha256: hash(packBytes),
  evidence_record: 'eval/experiments/2026-10-03-name-action-admission-v1-result.md',
  last_outcome: pack.backlog_fix,
  deterministic_admission_control_count: 20,
  new_model_runs: 0,
};
await read(nameEntry.evidence_record);
const catalog = {
  schema_version: 44,
  catalog_id: 'zh-ru-development-regressions-v44',
  base_catalog_file: 'catalog-v43.json',
  base_catalog_sha256: hash(termBytes),
  entries: [...termCatalog.entries, nameEntry],
};
const output = path.join(root, 'eval/regressions/catalog-v44.json');
if (process.argv[2] === '--write') {
  await fs.writeFile(output, `${JSON.stringify(catalog, null, 2)}\n`, { flag: 'wx' });
} else {
  assert.equal(process.argv.length, 2);
  assert.deepEqual(JSON.parse(await fs.readFile(output)), catalog);
}
console.log('Catalog v44: TERM-02 and NAME-02 rejections retained; v42/v43 bytes unchanged.');
