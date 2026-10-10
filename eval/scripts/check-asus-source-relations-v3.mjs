import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePinnedSrt } from './cross-source-relation-screen.mjs';
import { sourceRelationsV3, sourceRelationWarningsV3 } from
  './source-relation-review-v3.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRoot = process.env.AURALIS_EVAL_SOURCE_ROOT;
const draftRoot = process.env.AURALIS_EVAL_DRAFT_ROOT;
const mode = process.argv[2];
assert(['--preflight', '--capture', '--check'].includes(mode)
  && process.argv.length === 3);
assert(sourceRoot && path.isAbsolute(sourceRoot),
  'AURALIS_EVAL_SOURCE_ROOT must be an absolute private source root');
assert(draftRoot && path.isAbsolute(draftRoot),
  'AURALIS_EVAL_DRAFT_ROOT must be an absolute private draft root');

const input = {
  source: {
    file: '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt',
    sha256: '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b',
  },
  draft: {
    file: '.cache/eval/v8-asus-single-target-v1/attempt-dVT3zA/7b/candidate.ru.srt',
    sha256: '746495ba8bfc9c7c3cee0b5021fea87c10605b1d8e07be6dc316907138ea48ee',
  },
};
const expectedFacts = [
  { cue_id: 24, kind: 'hall_stick_denial' },
  { cue_id: 226, kind: 'bios_disable_absence' },
  { cue_id: 253, kind: 'price_unannounced_at_review' },
];
const parentRules = [
  ['source-relation-review-v1.mjs',
    '215486c2a6fa85fc278ef84b28d0bd0abf7c99174311414aa982ab7c9b83c18a'],
  ['source-relation-review-v2.mjs',
    'f0d1bb879fbc869aa7ed7f1d3165eb657dfad0add8f7d873029bd44913315eb5'],
];
const reportPath = path.join(root,
  'eval/reports/2026-10-10-asus-source-relations-v3.json');
const privateParent = path.join(root,
  '.cache/eval/asus-source-relations-v3');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

async function pinned(spec, base) {
  const bytes = await fs.readFile(path.join(base, spec.file));
  assert.equal(sha256(bytes), spec.sha256,
    `Pinned private input changed: ${spec.file}`);
  return bytes;
}

async function ruleIdentity() {
  for (const [name, hash] of parentRules)
    assert.equal(sha256(await fs.readFile(path.join(root,
      'eval/scripts', name))), hash, `${name} changed`);
  return sha256(await fs.readFile(path.join(root,
    'eval/scripts/source-relation-review-v3.mjs')));
}

async function sourcePreflight() {
  const rule = await ruleIdentity();
  const sourceBytes = await pinned(input.source, sourceRoot);
  await pinned(input.draft, draftRoot);
  const source = parsePinnedSrt(sourceBytes);
  assert.equal(source.length, 268);
  const facts = source.flatMap((cue, index) => sourceRelationsV3(cue,
    source[index - 1] ?? null, source[index + 1] ?? null)
    .filter(kind => expectedFacts.some(item => item.kind === kind))
    .map(kind => ({ cue_id: cue.id, kind })));
  assert.deepEqual(facts, expectedFacts,
    'Source-only fact selection changed');
  return { rule, source, facts };
}

async function compute() {
  const { rule, source, facts } = await sourcePreflight();
  const draft = parsePinnedSrt(await pinned(input.draft, draftRoot));
  assert.equal(draft.length, source.length);
  const warnings = [];
  for (let index = 0; index < source.length; index += 1) {
    const cue = source[index];
    const target = draft[index];
    assert.equal(target.id, cue.id, 'Source/target cue ID differs');
    assert.equal(target.timing, cue.timing, 'Source/target timing differs');
    const kinds = sourceRelationsV3(cue,
      source[index - 1] ?? null, source[index + 1] ?? null);
    const found = sourceRelationWarningsV3(cue,
      source[index - 1] ?? null, source[index + 1] ?? null, target.text);
    assert(found.every(row => row.cue_id === cue.id &&
      kinds.includes(row.kind)), 'Warning lacks a source trigger');
    warnings.push(...found);
  }
  return {
    schema_version: 1,
    experiment: 'ASUS-SOURCE-RELATIONS-2026-10-10-v3',
    split: 'exposed_asus_development_not_holdout',
    plan_commit: '9fb6d32',
    input_sha256: { source: input.source.sha256,
      retained_v8_draft: input.draft.sha256 },
    rule_sha256: rule,
    parent_rule_sha256: Object.fromEntries(parentRules),
    source_cues: source.length,
    aligned_source_target_pairs: source.length,
    recognized_new_fact_cues: facts,
    recognized_new_fact_count: facts.length,
    source_fact_coverage: `${facts.length}/${source.length}`,
    warnings,
    warning_count: warnings.length,
    independent_warning_precision: null,
    independent_warning_precision_reason: 'no_bilingual_reviewer',
    human_bilingual_reviews: 0,
    model_requests: 0,
    asr_requests: 0,
    tts_requests: 0,
    retries: 0,
    product_rule_admitted: false,
  };
}

if (mode === '--preflight') {
  const { rule, facts } = await sourcePreflight();
  console.log(JSON.stringify({ status: 'source_only_preflight_passed',
    rule_sha256: rule, source_sha256: input.source.sha256,
    draft_sha256: input.draft.sha256, facts }));
} else if (mode === '--check') {
  const expected = await compute();
  const bytes = await fs.readFile(reportPath);
  const recorded = JSON.parse(bytes);
  assert.deepEqual(recorded.observations, expected);
  assert(Number.isFinite(Date.parse(recorded.started_at)) &&
    Number.isFinite(Date.parse(recorded.finished_at)));
  assert(recorded.elapsed_ms >= 0 && recorded.elapsed_ms <= 30_000);
  console.log(JSON.stringify({ status: 'verified_asus_source_relations_v3',
    report_sha256: sha256(bytes), source_cues: expected.source_cues,
    recognized_new_fact_count: expected.recognized_new_fact_count,
    warning_count: expected.warning_count }));
} else {
  await fs.mkdir(privateParent, { recursive: true });
  const workspace = await fs.mkdtemp(path.join(privateParent, 'attempt-'));
  const start = performance.now();
  const startedAt = new Date().toISOString();
  const attempt = { experiment: 'ASUS-SOURCE-RELATIONS-2026-10-10-v3',
    started_at: startedAt, status: 'started' };
  try {
    const head = execFileSync('git', ['rev-parse', 'HEAD'],
      { cwd: root, encoding: 'utf8' }).trim();
    const observations = await compute();
    const elapsedMs = Math.ceil(performance.now() - start);
    assert(elapsedMs <= 30_000, 'Offline screen exceeded frozen wall budget');
    const report = { started_at: startedAt,
      finished_at: new Date().toISOString(), elapsed_ms: elapsedMs,
      capture_commit: head, observations };
    const bytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`);
    await fs.writeFile(reportPath, bytes, { flag: 'wx' });
    attempt.status = 'captured';
    attempt.report_sha256 = sha256(bytes);
    attempt.warning_count = observations.warning_count;
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
