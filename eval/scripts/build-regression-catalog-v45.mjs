import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv.length === 3 && process.argv[2] === '--write';
assert(process.argv.length === 2 || write, 'Only --write is supported');
const read = relative => fs.readFile(path.join(root, relative));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const [baseBytes, packBytes, privateBytes, sourceBytes] = await Promise.all([
  read('eval/regressions/catalog-v44.json'),
  read('eval/regressions/reg-065-vivo-v8-terminal-line-break-v1.json'),
  read('.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/report.json'),
  read('.cache/eval/youtube-geekerwan-vivo-original-caption/attempt-LQWxgw/source.zh.srt'),
]);
const base = JSON.parse(baseBytes);
const pack = JSON.parse(packBytes);
const raw = JSON.parse(privateBytes);
assert.equal(base.schema_version, 44);
assert.deepEqual(base.entries.map(row => row.id), ['REG-062', 'REG-063']);
assert.equal(pack.id, 'REG-065');
assert.equal(pack.status, 'deterministic_fix_verified_natural_recheck_pending');
assert.equal(pack.source_sha256, digest(sourceBytes));
assert.equal(pack.private_report_sha256, digest(privateBytes));
assert.equal(pack.human_review, 'missing');
assert.equal(pack.language_quality_claim, false);
assert.equal(new Set([...pack.related_controls, ...pack.negative_controls]
  .map(row => row.id)).size, pack.related_controls.length + pack.negative_controls.length);
const arm = raw.arms[0];
assert.equal(arm.id, '1_8b');
assert.equal(arm.model_sha256, pack.model_sha256);
assert.equal(arm.manifest_sha256, pack.profile_sha256);
assert.equal(arm.checkpoints.length, pack.minimal_reproduction.durable_prefix_batches);
assert.equal(arm.results.length, pack.minimal_reproduction.published_result_count);
const last = arm.requests.filter(row => row.request_kind === 'chat_completion').at(-1);
assert.equal(last.request_sha256, pack.minimal_reproduction.request_sha256);
assert.equal(digest(Buffer.from(last.raw_response)),
  pack.minimal_reproduction.raw_response_sha256);
assert.equal(last.outcome, 'invalid_candidate');
const content = JSON.parse(last.raw_response).choices[0].message.content;
const translated = JSON.parse(content).translations;
assert.deepEqual(translated.map(row => row.segment_id),
  pack.minimal_reproduction.target_ids);
assert(translated.every(row => row.text.endsWith('\n')));
assert(!translated.some(row => /[\r\n]/u.test(row.text.slice(0, -1))));
const evidenceRecord = 'eval/experiments/2026-10-09-vivo-original-v8-long-result.md';
await read(evidenceRecord);
const entry = {
  id: 'REG-065',
  source_family: pack.source_family,
  split: 'known_development_not_holdout',
  category: 'terminal_line_break_in_single_line_target_text',
  profile_scope: 'Hy-MT2 1.8B Q4_K_M v8 batch4; shared v7/v8 provider validation',
  expected_invariant: 'Only terminal CR/LF layout characters in decoded target text may be removed; identity, control, money and JSON-leak checks still run before checkpoint.',
  severity: pack.severity,
  pack_file: 'reg-065-vivo-v8-terminal-line-break-v1.json',
  pack_sha256: digest(packBytes),
  minimal_reproducer_count: 1,
  related_control_count: pack.related_controls.length,
  negative_control_count: pack.negative_controls.length,
  evidence_record: evidenceRecord,
  last_outcome: 'The original 1.8B run failed at batch 29 without partial publication. Deterministic v7/v8 provider checks accept terminal line breaks while rejecting internal controls; full natural-file recheck remains open.',
};
const catalog = { schema_version: 45,
  catalog_id: 'zh-ru-development-regressions-v45',
  base_catalog_file: 'catalog-v44.json',
  base_catalog_sha256: digest(baseBytes),
  entries: [...base.entries, entry] };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v45.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v45 ${write ? 'written' : 'verified'}: REG-062/063 retained, exact REG-065 failure and nine controls linked.`);
