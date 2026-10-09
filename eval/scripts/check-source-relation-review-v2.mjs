import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sourceRelationWarnings } from './source-relation-review-v1.mjs';
import { sourceRelationWarningsV2 } from './source-relation-review-v2.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRoot = process.env.AURALIS_EVAL_ASSET_ROOT ?? root;
const mode = process.argv[2];
assert(['--capture', '--check'].includes(mode) && process.argv.length === 3);
const base = path.join(sourceRoot,
  '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/7b');
const priorPath = path.join(sourceRoot,
  '.cache/eval/source-fact-hints-v1/attempt-HtkAPR/requests.jsonl');
const focusPath = path.join(root,
  '.cache/eval/vivo-focus-slot-v1/attempt-Q1EDOt/requests.jsonl');
const reportPath = path.join(root,
  'eval/reports/2026-10-10-source-relation-review-v2.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const pinned = {
  source: 'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4',
  draft: '4451868ea3e7cbb3ed81f3d24b5f85bc61a749168b213c54c88ae552208c4831',
  prior: '72e52f740ffa1b4dce7e88168a6872eb2687ab44e1f39fd19e0316a10b8f767f',
  focus: 'bc6508be55d9e9862a54a60102b36de4db427c3281eb5ff9fb2ba12ee32f4de7',
  v1_report: '86900f84bc40afc63c46796bf4375e2d9096c13497a301c3dbda7d73ce3763b8',
  focus_report: 'd779f08043e3410f78f25613ed7bf3ed1ef6c15d75019ed3494b9860e6dd2b75',
};

function timestampMs(value) {
  const match = /^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/u.exec(value);
  assert(match, 'invalid SRT timestamp');
  return (((Number(match[1]) * 60 + Number(match[2])) * 60 +
    Number(match[3])) * 1000 + Number(match[4]));
}

function parseSrt(bytes) {
  return bytes.toString('utf8').replace(/^\uFEFF/u, '').trimEnd()
    .split(/\r?\n\r?\n/u).map((block, index) => {
      const lines = block.split(/\r?\n/u);
      const id = Number(lines[0]);
      assert.equal(id, index + 1);
      const timing = /^(\S+) --> (\S+)$/u.exec(lines[1]);
      assert(timing && lines.length >= 3);
      const startMs = timestampMs(timing[1]);
      const endMs = timestampMs(timing[2]);
      assert(endMs > startMs);
      return { id, startMs, endMs, timing: lines[1],
        text: lines.slice(2).join('\n') };
    });
}

const [sourceBytes, draftBytes, priorBytes, focusBytes, v1Bytes,
  focusReportBytes, v1RuleBytes, v2RuleBytes, packBytes] =
  await Promise.all([
    fs.readFile(path.join(base, 'source.zh.srt')),
    fs.readFile(path.join(base, 'candidate.ru.srt')),
    fs.readFile(priorPath), fs.readFile(focusPath),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-10-source-relation-review-v1.json')),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-10-vivo-focus-slot-v1.json')),
    fs.readFile(path.join(root, 'eval/scripts/source-relation-review-v1.mjs')),
    fs.readFile(path.join(root, 'eval/scripts/source-relation-review-v2.mjs')),
    fs.readFile(path.join(root,
      'eval/regressions/reg-071-future-product-shorthand-review-v1.json')),
  ]);
for (const [bytes, expected] of [[sourceBytes, pinned.source],
  [draftBytes, pinned.draft], [priorBytes, pinned.prior],
  [focusBytes, pinned.focus], [v1Bytes, pinned.v1_report],
  [focusReportBytes, pinned.focus_report]])
  assert.equal(digest(bytes), expected);
const source = parseSrt(sourceBytes);
const draft = parseSrt(draftBytes);
const v1 = JSON.parse(v1Bytes);
const focusReport = JSON.parse(focusReportBytes);
const pack = JSON.parse(packBytes);
assert.equal(source.length, 467);
assert.equal(draft.length, source.length);
assert.equal(pack.id, 'REG-071');
assert.equal(pack.focus_machine_report_sha256, pinned.focus_report);
assert.equal(pack.v1_relation_report_sha256, pinned.v1_report);

const fullWarnings = [];
for (let i = 0; i < source.length; i += 1) {
  assert.equal(draft[i].id, source[i].id);
  assert.equal(draft[i].timing, source[i].timing);
  fullWarnings.push(...sourceRelationWarningsV2(source[i],
    source[i - 1] ?? null, source[i + 1] ?? null, draft[i].text));
}
const previousWarnings = v1.full_draft_warnings;
for (const warning of previousWarnings)
  assert(fullWarnings.some(row => row.cue_id === warning.cue_id &&
    row.kind === warning.kind));

const prior = priorBytes.toString('utf8').trimEnd().split('\n').map(JSON.parse);
const focus = focusBytes.toString('utf8').trimEnd().split('\n').map(JSON.parse);
assert.equal(prior.length, 36);
assert.equal(focus.length, 20);
const replay = [];
for (const [family, rows, expectedCases] of [
  ['prior', prior, ['natural_276', 'natural_280', 'natural_466']],
  ['focus', focus, ['natural_466']],
]) {
  for (const caseId of expectedCases) {
    const matching = rows.filter(row => row.case_id === caseId);
    assert.equal(matching.length, 2);
    const cueId = Number(caseId.slice('natural_'.length));
    for (const row of matching) {
      assert.equal(row.status, 'valid_unreviewed');
      assert(row.target_ids.includes(cueId));
      const translated = row.translations.find(item =>
        item.segment_id === cueId && item.line_index === 0);
      assert(translated);
      const rawSha = digest(Buffer.from(row.chat.raw_response));
      if (family === 'focus') {
        const frozen = focusReport.responses.find(item =>
          item.case_id === caseId && item.arm === row.arm);
        assert(frozen);
        assert.equal(frozen.request_sha256, row.request_sha256);
        assert.equal(frozen.raw_http_sha256, rawSha);
        assert.equal(frozen.focus_text_sha256,
          digest(Buffer.from(translated.text)));
      }
      const current = source[cueId - 1];
      const previous = source[cueId - 2] ?? null;
      const next = source[cueId] ?? null;
      replay.push({ family, case_id: caseId, arm: row.arm,
        request_sha256: row.request_sha256, raw_http_sha256: rawSha,
        v1_warnings: sourceRelationWarnings(current, previous, next,
          translated.text),
        v2_warnings: sourceRelationWarningsV2(current, previous, next,
          translated.text) });
    }
  }
}
assert.equal(replay.length, 8);
const minimal = replay.find(row => row.family === 'focus' &&
  row.case_id === 'natural_466' && row.arm === 'focus');
assert(minimal);
assert.equal(minimal.request_sha256,
  pack.minimal_reproducer.focus_request_sha256);
assert.equal(minimal.raw_http_sha256,
  pack.minimal_reproducer.focus_raw_http_sha256);
assert.equal(minimal.v1_warnings.length, 0);
assert.deepEqual(minimal.v2_warnings,
  [{ cue_id: 466, kind: 'future_product_expectation' }]);
const report = { schema_version: 1,
  experiment: 'source-relation-review-v2-offline-2026-10-10',
  split: 'known_natural_development_not_holdout',
  source_sha256: pinned.source, draft_sha256: pinned.draft,
  prior_journal_sha256: pinned.prior,
  focus_journal_sha256: pinned.focus,
  v1_report_sha256: pinned.v1_report,
  focus_report_sha256: pinned.focus_report,
  v1_rule_sha256: digest(v1RuleBytes),
  v2_rule_sha256: digest(v2RuleBytes),
  reg071_pack_sha256: digest(packBytes),
  source_cues: source.length,
  v1_full_draft_warnings: previousWarnings,
  v2_full_draft_warnings: fullWarnings,
  new_full_draft_warnings: fullWarnings.filter(row =>
    !previousWarnings.some(old => old.cue_id === row.cue_id &&
      old.kind === row.kind)),
  replay, model_requests: 0, human_bilingual_reviews: 0,
  decision: 'evaluation_only_warning_no_product_change' };
if (mode === '--capture')
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
else assert.deepEqual(JSON.parse(await fs.readFile(reportPath, 'utf8')),
  report);
console.log(JSON.stringify({ source_cues: source.length,
  full_warnings: fullWarnings.length,
  new_full_warnings: report.new_full_draft_warnings.length,
  replay: replay.length, minimal_v1: minimal.v1_warnings.length,
  minimal_v2: minimal.v2_warnings.length, reportPath }));
