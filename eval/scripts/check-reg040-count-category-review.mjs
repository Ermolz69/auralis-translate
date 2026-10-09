import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePinnedSrt } from './cross-source-relation-screen.mjs';
import { countCategoryReview } from './count-category-review-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT;
const mode = process.argv[2];
assert(['--preflight', '--capture', '--check'].includes(mode) &&
  process.argv.length === 3);
assert(assetRoot && path.isAbsolute(assetRoot),
  'AURALIS_EVAL_ASSET_ROOT must be absolute');
const experiment = 'REG-040-COUNT-CATEGORY-2026-10-10-v1';
const reportPath = path.join(root,
  'eval/reports/2026-10-10-reg040-count-category-review-v1.json');
const privateParent = path.join(root,
  '.cache/eval/reg040-count-category-review-v1');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const pinned = {
  source: '4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964',
  oneB: '042c0ffffd67a4ea6f562645655ffe9db823866d7505b4ed64708e0ff829df4d',
  sevenB: '45f140e201f5a6228a0754e48d1e2b4153a392a7869dc279768339882fa53511',
  controls: '3266febf06462eddbd9b605d18c2cd8675f4dd688f473a11f3cad8e391851ce4',
  regression: 'd46eb7e8020f5ddcf30b99f21bd16fd01ca8e96daf2302057db55e6776890918',
  rule: 'f840c0adbb84f77823686b5df7a04d91954426dd31b425dfc789a7b5c8717a77',
};
const files = {
  source: ['.cache/eval/commons-sethlui-derived-v1/source.zh.srt', assetRoot],
  oneB: ['.cache/eval/commons-sethlui-full-v6-1b-v1/run-Hp7iM7/candidate.ru.srt', assetRoot],
  sevenB: ['.cache/eval/commons-sethlui-json-tail-length-retry-7b-v2/run-mHswjb/candidate.ru.srt', assetRoot],
  controls: ['eval/corpora/reg040-count-category-controls-v1.json', root],
  regression: ['eval/regressions/sethlui-source-facts-v1.json', root],
  rule: ['eval/scripts/count-category-review-v1.mjs', root],
};

async function checkedBytes(key) {
  const [file, base] = files[key];
  const bytes = await fs.readFile(path.join(base, file));
  assert.equal(digest(bytes), pinned[key], `Pinned ${key} bytes changed`);
  return bytes;
}

async function loadPinnedInputs() {
  const [sourceBytes, oneBBytes, sevenBBytes, controlBytes, regressionBytes] =
    await Promise.all(['source', 'oneB', 'sevenB', 'controls', 'regression']
      .map(checkedBytes));
  await checkedBytes('rule');
  const source = parsePinnedSrt(sourceBytes);
  const drafts = [
    { id: '1_8b_v6', sha256: pinned.oneB, cues: parsePinnedSrt(oneBBytes) },
    { id: '7b_v6', sha256: pinned.sevenB, cues: parsePinnedSrt(sevenBBytes) },
  ];
  const controls = JSON.parse(controlBytes).cases;
  assert.equal(controls.length, 18);
  for (const item of controls)
    assert.equal(countCategoryReview(item.source, item.target).warning,
      item.warn, `Frozen control ${item.id} changed`);
  const regression = JSON.parse(regressionBytes);
  assert.equal(regression.id, 'REG-040');
  assert.equal(regression.private_reproducer.source_sha256, pinned.source);
  assert.equal(regression.private_reproducer.candidate_sha256, pinned.oneB);
  assert.equal(source.length, 263);
  for (const draft of drafts) {
    assert.equal(draft.cues.length, source.length);
    for (let index = 0; index < source.length; index += 1) {
      assert.equal(draft.cues[index].id, source[index].id,
        'Draft cue identity changed');
      assert.equal(draft.cues[index].timing, source[index].timing,
        'Draft timing changed');
    }
  }
  const reproducer = regression.private_reproducer.cases.find(row =>
    row.cue_id === 35);
  assert.equal(digest(Buffer.from(source[34].text)), reproducer.source_text_sha256);
  assert.equal(digest(Buffer.from(drafts[0].cues[34].text)),
    reproducer.accepted_text_sha256);
  return { source, drafts, controls };
}

async function buildReport() {
  const started = performance.now();
  const { source, drafts, controls } = await loadPinnedInputs();
  const output = [];
  for (const draft of drafts) {
    const sourceRelations = [];
    const targetRelations = [];
    const warnings = [];
    for (let index = 0; index < source.length; index += 1) {
      const now = source[index];
      const target = draft.cues[index];
      const review = countCategoryReview(now.text, target.text);
      if (review.source_relation) sourceRelations.push(now.id);
      if (review.target_relation) targetRelations.push(now.id);
      if (review.warning)
        warnings.push({ cue_id: now.id, kind: 'count_category_swap' });
    }
    output.push({ id: draft.id, draft_sha256: draft.sha256,
      cue_count: draft.cues.length, source_relation_cue_ids: sourceRelations,
      target_relation_cue_ids: targetRelations, warnings,
      warning_precision: null, human_bilingual_reviews: 0 });
  }
  const known = output.find(arm => arm.id === '1_8b_v6');
  assert(known.warnings.some(row => row.cue_id === 35 &&
    row.kind === 'count_category_swap'), 'Known REG-040 cue 35 was not warned');
  assert(performance.now() - started <= 20_000,
    'Offline replay exceeded frozen wall budget');
  return { schema_version: 1, experiment,
    split: 'exposed_natural_development_not_holdout',
    source_sha256: pinned.source, source_cues: source.length,
    control_sha256: pinned.controls, control_count: controls.length,
    rule_sha256: pinned.rule, regression_sha256: pinned.regression,
    arms: output,
    source_target_pairs: source.length * output.length,
    model_requests: 0, asr_requests: 0, tts_requests: 0,
    product_rule_admitted: false, language_quality_accepted: false };
}

if (mode === '--preflight') {
  const { source, drafts, controls } = await loadPinnedInputs();
  console.log(JSON.stringify({ status: 'verified_reg040_input_identity',
    source_cues: source.length, arms: drafts.map(draft => draft.id),
    controls: controls.length }));
} else if (mode === '--check') {
  const expected = await buildReport();
  const raw = await fs.readFile(reportPath);
  assert.deepEqual(JSON.parse(raw), expected);
  console.log(JSON.stringify({ status: 'verified_reg040_offline_warning',
    report_sha256: digest(raw), source_target_pairs: expected.source_target_pairs,
    arms: expected.arms.map(arm => ({ id: arm.id,
      source_relations: arm.source_relation_cue_ids.length,
      target_relations: arm.target_relation_cue_ids.length,
      warnings: arm.warnings })) }));
} else {
  await fs.mkdir(privateParent, { recursive: true });
  const workspace = await fs.mkdtemp(path.join(privateParent, 'attempt-'));
  const attempt = { experiment, started_at: new Date().toISOString(),
    status: 'started' };
  try {
    const result = await buildReport();
    const bytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
    await fs.writeFile(reportPath, bytes, { flag: 'wx' });
    attempt.status = 'captured';
    attempt.report_sha256 = digest(bytes);
    attempt.source_target_pairs = result.source_target_pairs;
    attempt.warnings = result.arms.map(arm => ({ id: arm.id,
      warnings: arm.warnings.length }));
    console.log(JSON.stringify({ private_attempt: workspace, ...attempt }));
  } catch (error) {
    attempt.status = 'failed';
    attempt.error = String(error);
    throw error;
  } finally {
    attempt.finished_at = new Date().toISOString();
    await fs.writeFile(path.join(workspace, 'attempt.json'),
      `${JSON.stringify(attempt, null, 2)}\n`, { flag: 'wx' });
  }
}
