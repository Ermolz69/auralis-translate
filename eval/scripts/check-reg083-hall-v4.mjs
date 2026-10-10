import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { parsePinnedSrt } from './cross-source-relation-screen.mjs';
import { sourceRelationWarningsV3 } from './source-relation-review-v3.mjs';
import { sourceRelationsV4, sourceRelationWarningsV4 } from
  './source-relation-review-v4.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv[2];
assert(['--preflight', '--capture', '--check'].includes(mode) &&
  process.argv.length === 3);
const sourceRoot = process.env.AURALIS_EVAL_SOURCE_ROOT;
const draftRoot = process.env.AURALIS_EVAL_DRAFT_ROOT;
assert(sourceRoot && path.isAbsolute(sourceRoot));
assert(draftRoot && path.isAbsolute(draftRoot));
const source = {
  file: '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt',
  sha256: '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b',
};
const draft = {
  file: '.cache/eval/v8-asus-single-target-v1/attempt-dVT3zA/7b/candidate.ru.srt',
  sha256: '746495ba8bfc9c7c3cee0b5021fea87c10605b1d8e07be6dc316907138ea48ee',
};
const v3 = {
  rule_sha256: 'bd1f9926b52150f21d398895237b69ea9e1d4c4698bbc9392e3c52c58604eb03',
  report_sha256: '8d3eb1020f660fb3c72aa4cc369cc8ca57b394e2089f63e3d7715686f4db8468',
};
const v4RuleSha =
  '08e4e506c502679d0b0ce92e7901c24a6fc952f7c5849acabe8979788df24148';
const packSha =
  '682b01c976357e003bc2b58e130ba08ff8dae1228608bfb229a30274af42d313';
const reportPath = path.join(root,
  'eval/reports/2026-10-10-reg083-hall-v4.json');
const privateRoot = path.join(root, '.cache/eval/reg083-hall-v4');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

async function pinned(spec, base) {
  const bytes = await fs.readFile(path.join(base, spec.file));
  assert.equal(sha(bytes), spec.sha256,
    `Pinned private input changed: ${spec.file}`);
  return bytes;
}

async function preflight() {
  assert.equal(sha(await fs.readFile(path.join(root,
    'eval/scripts/source-relation-review-v3.mjs'))), v3.rule_sha256);
  assert.equal(sha(await fs.readFile(path.join(root,
    'eval/scripts/source-relation-review-v4.mjs'))), v4RuleSha);
  assert.equal(sha(await fs.readFile(path.join(root,
    'eval/reports/2026-10-10-asus-source-relations-v3.json'))),
  v3.report_sha256);
  assert.equal(sha(await fs.readFile(path.join(root,
    'eval/regressions/reg-083-asus-hall-stick-substitution-v1.json'))),
  packSha);
  const cues = parsePinnedSrt(await pinned(source, sourceRoot));
  assert.equal(cues.length, 268);
  await pinned(draft, draftRoot);
  const triggerIds = cues.filter((cue, index) =>
    sourceRelationsV4(cue, cues[index - 1] ?? null,
      cues[index + 1] ?? null).includes('hall_stick_referent'))
    .map(cue => cue.id);
  assert(triggerIds.includes(24), 'REG-083 source trigger disappeared');
  return { cues, triggerIds };
}

async function compute() {
  const { cues, triggerIds } = await preflight();
  const targets = parsePinnedSrt(await pinned(draft, draftRoot));
  assert.equal(targets.length, cues.length);
  const oldWarnings = [];
  const newWarnings = [];
  for (let index = 0; index < cues.length; index += 1) {
    const current = cues[index];
    const target = targets[index];
    assert.equal(target.id, current.id, 'Cue identity changed');
    assert.equal(target.timing, current.timing, 'Cue timing changed');
    const previous = cues[index - 1] ?? null;
    const next = cues[index + 1] ?? null;
    const before = sourceRelationWarningsV3(current, previous, next,
      target.text);
    const after = sourceRelationWarningsV4(current, previous, next,
      target.text);
    assert.deepEqual(after.slice(0, before.length), before,
      'v4 changed an existing v3 warning');
    oldWarnings.push(...before);
    newWarnings.push(...after.slice(before.length));
  }
  assert.equal(oldWarnings.length, 0,
    'Frozen v3 zero-warning baseline changed');
  assert(newWarnings.every(row => triggerIds.includes(row.cue_id) &&
    row.kind === 'hall_stick_referent_missing' &&
    row.missing.length > 0));
  return {
    schema_version: 1,
    experiment: 'REG-083-HALL-REFERENT-2026-10-10-v4',
    split: 'exposed_asus_development_not_holdout',
    source_sha256: source.sha256,
    draft_sha256: draft.sha256,
    v3,
    v4_rule_sha256: v4RuleSha,
    regression_pack_sha256: packSha,
    source_cues: cues.length,
    aligned_pairs: targets.length,
    source_trigger_ids: triggerIds,
    v3_warning_count: oldWarnings.length,
    v4_new_warnings: newWarnings,
    v4_new_warning_count: newWarnings.length,
    known_reg083_warning: newWarnings.some(row => row.cue_id === 24),
    independent_warning_precision: null,
    independent_warning_precision_reason: 'no_bilingual_reviewer',
    model_requests: 0,
    asr_requests: 0,
    tts_requests: 0,
    retries: 0,
    product_rule_admitted: false,
  };
}

if (mode === '--preflight') {
  const { triggerIds } = await preflight();
  console.log(JSON.stringify({ status: 'source_only_preflight_passed',
    source_sha256: source.sha256, draft_sha256: draft.sha256,
    v4_rule_sha256: v4RuleSha, trigger_ids: triggerIds }));
} else if (mode === '--check') {
  const expected = await compute();
  const bytes = await fs.readFile(reportPath);
  const recorded = JSON.parse(bytes);
  assert.deepEqual(recorded.observations, expected);
  assert(Number.isFinite(Date.parse(recorded.started_at)) &&
    Number.isFinite(Date.parse(recorded.finished_at)));
  assert(recorded.elapsed_ms >= 0 && recorded.elapsed_ms <= 30_000);
  assert.match(recorded.capture_commit, /^[0-9a-f]{40}$/u);
  console.log(JSON.stringify({ status: 'verified_reg083_hall_v4',
    report_sha256: sha(bytes), source_trigger_ids: expected.source_trigger_ids,
    new_warning_count: expected.v4_new_warning_count }));
} else {
  assert.equal(execFileSync('git', ['status', '--porcelain'],
    { cwd: root, encoding: 'utf8' }).trim(), '',
  'Capture requires clean committed worktree');
  await fs.mkdir(privateRoot, { recursive: true });
  const attemptDir = await fs.mkdtemp(path.join(privateRoot, 'attempt-'));
  const startedAt = new Date().toISOString();
  const start = performance.now();
  const attempt = { experiment: 'REG-083-HALL-REFERENT-2026-10-10-v4',
    started_at: startedAt, status: 'started' };
  try {
    const head = execFileSync('git', ['rev-parse', 'HEAD'],
      { cwd: root, encoding: 'utf8' }).trim();
    const observations = await compute();
    const elapsedMs = Math.ceil(performance.now() - start);
    assert(elapsedMs <= 30_000, 'Replay exceeded frozen wall budget');
    const report = { started_at: startedAt,
      finished_at: new Date().toISOString(), elapsed_ms: elapsedMs,
      capture_commit: head, observations };
    const bytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`);
    await fs.writeFile(reportPath, bytes, { flag: 'wx' });
    attempt.status = 'captured';
    attempt.report_sha256 = sha(bytes);
    attempt.new_warning_count = observations.v4_new_warning_count;
    console.log(JSON.stringify({ private_attempt: attemptDir, ...attempt }));
  } catch (error) {
    attempt.status = 'failed';
    attempt.error = String(error);
    throw error;
  } finally {
    attempt.finished_at = new Date().toISOString();
    await fs.writeFile(path.join(attemptDir, 'attempt.json'),
      `${JSON.stringify(attempt, null, 2)}\n`, { flag: 'wx' });
  }
}
