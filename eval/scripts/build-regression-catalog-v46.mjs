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
const [baseBytes, packBytes, oldBytes, recoveryBytes, sourceBytes] = await Promise.all([
  read('eval/regressions/catalog-v45.json'),
  read('eval/regressions/reg-066-vivo-v8-cross-model-facts-v1.json'),
  read('.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/report.json'),
  read('.cache/eval/reg065-vivo-copy-recovery-v1/attempt-mVbgXB/report.json'),
  read('.cache/eval/youtube-geekerwan-vivo-original-caption/attempt-LQWxgw/source.zh.srt'),
]);
const base = JSON.parse(baseBytes);
const pack = JSON.parse(packBytes);
const old = JSON.parse(oldBytes);
const recovery = JSON.parse(recoveryBytes);
assert.equal(base.schema_version, 45);
assert.deepEqual(base.entries.map(row => row.id), ['REG-062', 'REG-063', 'REG-065']);
assert.equal(pack.id, 'REG-066');
assert.equal(pack.status, 'ai_triaged_unfixed');
assert.equal(pack.source_sha256, digest(sourceBytes));
assert.equal(pack.large_original_report_sha256, digest(oldBytes));
assert.equal(pack.small_recovery_report_sha256, digest(recoveryBytes));
assert.equal(recovery.status, 'completed');
assert.equal(recovery.checkpoints.length, 117);
assert.equal(recovery.results[0].review_state, 'needs_review');
assert.deepEqual(pack.model_response_reproducers.map(row => row.focus_cue),
  [60, 276, 280, 328, 466]);
const oldChats = old.arms[1].requests.filter(row => row.request_kind === 'chat_completion');
const newChats = recovery.requests.filter(row => row.request_kind === 'chat_completion');
for (const item of pack.model_response_reproducers) {
  assert(item.batch_first_cue <= item.focus_cue);
  assert(item.focus_cue < item.batch_first_cue + 4);
  for (const [prefix, chats] of [['small', newChats], ['large', oldChats]]) {
    const chat = chats.find(row => row.segment_id === item.batch_first_cue);
    assert(chat, `Missing ${prefix} chat for cue ${item.focus_cue}`);
    assert.equal(chat.outcome, 'validated_batch');
    assert.equal(chat.request_sha256, item[`${prefix}_request_sha256`]);
    assert.equal(digest(Buffer.from(chat.raw_response)),
      item[`${prefix}_raw_response_sha256`]);
  }
}
assert.equal(pack.related_controls.length, 5);
assert.equal(pack.negative_controls.length, 5);
assert.equal(new Set([...pack.related_controls, ...pack.negative_controls]
  .map(row => row.id)).size, 10);
assert([...pack.related_controls, ...pack.negative_controls]
  .every(row => (row.source || row.source_lines?.length === 2) &&
    row.expected && row.outcome === 'pending_model_screen'));
assert.equal(pack.human_review, 'missing');
const evidenceRecord = 'eval/experiments/2026-10-09-vivo-reg065-copy-recovery-result.md';
await read(evidenceRecord);
const updated = base.entries.map(entry => entry.id === 'REG-065' ? {
  ...entry,
  last_outcome: 'A single committed-binary copy resume reached 467/467 cues; its fresh cue-113 reply had no terminal LF, so deterministic controls alone isolate normalization. Language quality remains open.',
  recovery_evidence_record: evidenceRecord,
} : entry);
const entry = {
  id: pack.id, source_family: pack.source_family,
  split: pack.split, category: 'cross_model_numeric_team_time_future_fact_drift',
  profile_scope: 'Hy-MT2 1.8B and 7B Q4_K_M v8 batch4 on the same 467-cue original-platform Vivo SRT',
  expected_invariant: 'Keep generation, 36-month lead, thousand-person team, 01:00–02:00 and future-product modality across source cue boundaries.',
  severity: pack.severity,
  pack_file: 'reg-066-vivo-v8-cross-model-facts-v1.json',
  pack_sha256: digest(packBytes),
  minimal_reproducer_count: pack.model_response_reproducers.length,
  related_control_count: pack.related_controls.length,
  negative_control_count: pack.negative_controls.length,
  evidence_record: evidenceRecord,
  last_outcome: 'Source-aware AI triage flags five paired fact/language risks in full 1.8B and 7B drafts; fresh authored controls have not been run and human review is missing.',
};
const catalog = { schema_version: 46,
  catalog_id: 'zh-ru-development-regressions-v46',
  base_catalog_file: 'catalog-v45.json',
  base_catalog_sha256: digest(baseBytes),
  entries: [...updated, entry] };
const output = `${JSON.stringify(catalog, null, 2)}\n`;
const outputPath = path.join(root, 'eval/regressions/catalog-v46.json');
if (write) await fs.writeFile(outputPath, output, { flag: 'wx' });
else assert.equal(await fs.readFile(outputPath, 'utf8'), output);
console.log(`Catalog v46 ${write ? 'written' : 'verified'}: five paired Vivo risks, ten pending authored controls and REG-065 recovery linked.`);
