import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePinnedSrt, screenSourceAndDrafts } from
  './cross-source-relation-screen.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT;
const mode = process.argv[2];
assert(['--capture', '--check'].includes(mode) && process.argv.length === 3);
assert(assetRoot && path.isAbsolute(assetRoot),
  'AURALIS_EVAL_ASSET_ROOT must be an absolute private asset root');
const reportPath = path.join(root,
  'eval/reports/2026-10-10-source-relation-cross-source-v1.json');
const privateParent = path.join(root,
  '.cache/eval/source-relation-cross-source-v1');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const ruleFiles = [
  ['eval/scripts/source-relation-review-v1.mjs',
    '215486c2a6fa85fc278ef84b28d0bd0abf7c99174311414aa982ab7c9b83c18a'],
  ['eval/scripts/source-relation-review-v2.mjs',
    'f0d1bb879fbc869aa7ed7f1d3165eb657dfad0add8f7d873029bd44913315eb5'],
];
const inputs = [
  { id: 'geekerwan-asus-rog-ally',
    source: ['.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt',
      '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b'],
    cueCount: 268,
    drafts: [{ id: '7b-v8',
      file: '.cache/eval/v8-asus-single-target-v1/attempt-dVT3zA/7b/candidate.ru.srt',
      sha256: '746495ba8bfc9c7c3cee0b5021fea87c10605b1d8e07be6dc316907138ea48ee' }] },
  { id: 'sethlui-restaurant',
    source: ['.cache/eval/commons-sethlui-derived-v1/source.zh.srt',
      '4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964'],
    cueCount: 263,
    drafts: [
      { id: '1_8b-v6',
        file: '.cache/eval/commons-sethlui-full-v6-1b-v1/run-Hp7iM7/candidate.ru.srt',
        sha256: '042c0ffffd67a4ea6f562645655ffe9db823866d7505b4ed64708e0ff829df4d' },
      { id: '7b-v6',
        file: '.cache/eval/commons-sethlui-json-tail-length-retry-7b-v2/run-mHswjb/candidate.ru.srt',
        sha256: '45f140e201f5a6228a0754e48d1e2b4153a392a7869dc279768339882fa53511' },
    ] },
];

async function pinnedBytes(file, expected, base) {
  const bytes = await fs.readFile(path.join(base, file));
  assert.equal(digest(bytes), expected, `Pinned input changed: ${file}`);
  return bytes;
}

async function buildReport() {
  const started = performance.now();
  for (const [file, sha256] of ruleFiles)
    await pinnedBytes(file, sha256, root);
  const groups = [];
  for (const item of inputs) {
    const source = parsePinnedSrt(await pinnedBytes(...item.source, assetRoot));
    assert.equal(source.length, item.cueCount);
    const drafts = [];
    for (const draft of item.drafts)
      drafts.push({ id: draft.id,
        cues: parsePinnedSrt(await pinnedBytes(draft.file, draft.sha256, assetRoot)) });
    const result = screenSourceAndDrafts(source, drafts);
    groups.push({ id: item.id, source_sha256: item.source[1],
      ...result,
      drafts: result.drafts.map(draft => ({ ...draft,
        sha256: item.drafts.find(spec => spec.id === draft.id).sha256 })) });
  }
  const elapsedMs = Math.ceil(performance.now() - started);
  assert(elapsedMs <= 20_000, 'Offline screen exceeded frozen wall budget');
  const totalPairs = groups.reduce((sum, group) =>
    sum + group.source_cues * group.drafts.length, 0);
  assert.equal(totalPairs, 794);
  return { schema_version: 1,
    experiment: 'SOURCE-RELATION-CROSS-SOURCE-2026-10-10-v1',
    split: 'exposed_natural_development_not_holdout',
    rule_sha256: Object.fromEntries(ruleFiles.map(([file, sha256]) =>
      [path.basename(file), sha256])),
    source_groups: groups,
    unique_source_cues: groups.reduce((sum, group) =>
      sum + group.source_cues, 0),
    source_target_pairs: totalPairs,
    recognized_relation_count: groups.reduce((sum, group) =>
      sum + group.recognized_relations.length, 0),
    warning_count: groups.reduce((sum, group) => sum +
      group.drafts.reduce((subtotal, draft) => subtotal + draft.warning_count, 0), 0),
    human_bilingual_reviews: 0,
    model_requests: 0,
    asr_requests: 0,
    tts_requests: 0,
    warning_precision: null,
    release_admitted: false };
}

if (mode === '--check') {
  const expected = await buildReport();
  const raw = await fs.readFile(reportPath);
  assert.deepEqual(JSON.parse(raw), expected);
  console.log(JSON.stringify({ status: 'verified_offline_cross_source',
    report_sha256: digest(raw), groups: expected.source_groups.length,
    source_target_pairs: expected.source_target_pairs,
    recognized_relation_count: expected.recognized_relation_count,
    warning_count: expected.warning_count }));
} else {
  await fs.mkdir(privateParent, { recursive: true });
  const workspace = await fs.mkdtemp(path.join(privateParent, 'attempt-'));
  const attempt = { experiment: 'SOURCE-RELATION-CROSS-SOURCE-2026-10-10-v1',
    started_at: new Date().toISOString(), status: 'started' };
  try {
    const result = await buildReport();
    const bytes = Buffer.from(`${JSON.stringify(result, null, 2)}\n`);
    await fs.writeFile(reportPath, bytes, { flag: 'wx' });
    attempt.status = 'captured';
    attempt.report_sha256 = digest(bytes);
    attempt.source_target_pairs = result.source_target_pairs;
    attempt.recognized_relation_count = result.recognized_relation_count;
    attempt.warning_count = result.warning_count;
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
