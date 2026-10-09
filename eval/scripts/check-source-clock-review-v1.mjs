import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceClockClass, sourceClockWarning } from './source-clock-review-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT ?? root;
const mode = process.argv[2];
assert(['--capture', '--check'].includes(mode) && process.argv.length === 3);
const base = path.join(assetRoot,
  '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/7b');
const journalPath = path.join(assetRoot,
  '.cache/eval/source-fact-hints-v1/attempt-HtkAPR/requests.jsonl');
const reportPath = path.join(root,
  'eval/reports/2026-10-09-source-clock-review-v1.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const pinned = {
  source: 'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4',
  draft: '4451868ea3e7cbb3ed81f3d24b5f85bc61a749168b213c54c88ae552208c4831',
  journal: '72e52f740ffa1b4dce7e88168a6872eb2687ab44e1f39fd19e0316a10b8f767f',
};

function timestampMs(value) {
  const match = /^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/u.exec(value);
  assert(match, 'invalid SRT timestamp');
  return (((Number(match[1]) * 60 + Number(match[2])) * 60 +
    Number(match[3])) * 1000 + Number(match[4]));
}

function parseSrt(bytes) {
  const blocks = bytes.toString('utf8').replace(/^\uFEFF/u, '').trimEnd()
    .split(/\r?\n\r?\n/u);
  return blocks.map((block, index) => {
    const lines = block.split(/\r?\n/u);
    const id = Number(lines[0]);
    assert.equal(id, index + 1, 'nonconsecutive SRT cue');
    const timing = /^(\S+) --> (\S+)$/u.exec(lines[1]);
    assert(timing && lines.length >= 3, 'invalid SRT cue');
    const startMs = timestampMs(timing[1]);
    const endMs = timestampMs(timing[2]);
    assert(endMs > startMs, 'invalid SRT duration');
    return { id, startMs, endMs, timing: lines[1],
      text: lines.slice(2).join('\n') };
  });
}

const [sourceBytes, draftBytes, journalBytes, ruleBytes] = await Promise.all([
  fs.readFile(path.join(base, 'source.zh.srt')),
  fs.readFile(path.join(base, 'candidate.ru.srt')),
  fs.readFile(journalPath),
  fs.readFile(path.join(root, 'eval/scripts/source-clock-review-v1.mjs')),
]);
assert.equal(digest(sourceBytes), pinned.source);
assert.equal(digest(draftBytes), pinned.draft);
assert.equal(digest(journalBytes), pinned.journal);
const source = parseSrt(sourceBytes);
const draft = parseSrt(draftBytes);
assert.equal(source.length, 467);
assert.equal(draft.length, source.length);

const fullWarnings = [];
const recognized = [];
for (let i = 0; i < source.length; i += 1) {
  assert.equal(draft[i].id, source[i].id);
  assert.equal(draft[i].timing, source[i].timing);
  const previous = source[i - 1] ?? null;
  const expected = sourceClockClass(source[i], previous);
  if (expected) recognized.push({ cue_id: source[i].id, expected });
  const warning = sourceClockWarning(source[i], previous, draft[i].text);
  if (warning) fullWarnings.push(warning);
}
assert(fullWarnings.some(row => row.cue_id === 328 &&
  row.expected === 'after_midnight_one_two' &&
  row.observed === 'eleven_twelve'));

const journal = journalBytes.toString('utf8').trimEnd().split('\n').map(JSON.parse);
assert.equal(journal.length, 36);
const paired = journal.filter(row => row.case_id === 'natural_328');
assert.equal(paired.length, 2);
const expectedRequestHashes = {
  baseline: '9ea3696c8965605918a5653247453bc9bfcbf8e0b665962a1fda495f2585b1d9',
  candidate: 'd281c6df71f7cb2b472f098002e604bd6f5532eb2c9f06dd1af1dbbfcf8eeb42',
};
const expectedRawHashes = {
  baseline: '82ddb26eee1ae7d0fe5f4bdb3a31d7dc1a40691cfdf9be7b0d6792bae793f411',
  candidate: 'f88adfd0185cca05dbba8193e3fa975e74b894bfc1e470f711beca5cd93caf4e',
};
const pairWarnings = {};
for (const row of paired) {
  assert(['baseline', 'candidate'].includes(row.arm));
  assert.equal(row.request_sha256, expectedRequestHashes[row.arm]);
  assert.equal(digest(Buffer.from(row.chat.raw_response)),
    expectedRawHashes[row.arm]);
  assert.deepEqual(row.target_ids, [325, 326, 327, 328]);
  assert.equal(row.status, 'valid_unreviewed');
  const translation = row.translations.find(item =>
    item.segment_id === 328 && item.line_index === 0);
  assert(translation);
  pairWarnings[row.arm] = {
    request_sha256: row.request_sha256,
    raw_http_sha256: expectedRawHashes[row.arm],
    warning: sourceClockWarning(source[327], source[326], translation.text),
  };
}
assert.equal(pairWarnings.baseline.warning, null);
assert(pairWarnings.candidate.warning);

const report = {
  schema_version: 1,
  experiment: 'source-clock-review-v1-offline-2026-10-09',
  split: 'known_natural_development_not_holdout',
  source_sha256: pinned.source,
  draft_sha256: pinned.draft,
  prior_journal_sha256: pinned.journal,
  rule_sha256: digest(ruleBytes),
  source_cues: source.length,
  draft_cues: draft.length,
  recognized_source_clocks: recognized,
  full_draft_warnings: fullWarnings,
  paired_natural_328: pairWarnings,
  model_requests: 0,
  human_bilingual_reviews: 0,
  decision: 'evaluation_only_warning_no_product_change',
};
if (mode === '--capture')
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
else assert.deepEqual(JSON.parse(await fs.readFile(reportPath, 'utf8')), report);
console.log(JSON.stringify({ source_cues: source.length,
  recognized: recognized.length, full_warnings: fullWarnings.length,
  warning_ids: fullWarnings.map(row => row.cue_id),
  baseline_warning: pairWarnings.baseline.warning !== null,
  candidate_warning: pairWarnings.candidate.warning !== null,
  report: reportPath }));
