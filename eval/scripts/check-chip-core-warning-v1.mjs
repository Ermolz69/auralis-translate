import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { chipCoreWarnings, explicitNegatedMulticore } from
  './chip-core-warning-v1.mjs';
import { parsePinnedSrt } from './cross-source-relation-screen.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv[2];
assert(['--freeze', '--preflight', '--capture', '--check'].includes(mode) &&
  process.argv.length === 3);
const roots = { vivo: process.env.AURALIS_VIVO_ASSET_ROOT,
  other: process.env.AURALIS_OTHER_ASSET_ROOT };
assert(Object.values(roots).every(value => value && path.isAbsolute(value)));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const relative = 'eval/experiments/2026-10-10-chip-core-warning-v1-freeze.json';
const freezePath = path.join(root, relative);
const reportPath = path.join(root,
  'eval/reports/2026-10-10-chip-core-warning-v1.json');
const privateParent = path.join(root, '.cache/eval/chip-core-warning-v1');
const inputs = [
  { group: 'vivo', root: 'vivo', count: 467,
    source: ['.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/7b/source.zh.srt',
      'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4'],
    drafts: [
      { id: '7b-v8', file: '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/7b/candidate.ru.srt',
        sha256: '4451868ea3e7cbb3ed81f3d24b5f85bc61a749168b213c54c88ae552208c4831' },
      { id: '1_8b-v8', file: '.cache/eval/reg065-vivo-copy-recovery-v1/attempt-mVbgXB/candidate.ru.srt',
        sha256: '32d96fe75eb0f5c90a67e2f6606d3d6ace27f79e67352a12b065efe91a08d3fc' },
    ] },
  { group: 'asus', root: 'other', count: 268,
    source: ['.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt',
      '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b'],
    drafts: [{ id: '7b-v8',
      file: '.cache/eval/v8-asus-single-target-v1/attempt-dVT3zA/7b/candidate.ru.srt',
      sha256: '746495ba8bfc9c7c3cee0b5021fea87c10605b1d8e07be6dc316907138ea48ee' }] },
  { group: 'sethlui', root: 'other', count: 263,
    source: ['.cache/eval/commons-sethlui-derived-v1/source.zh.srt',
      '4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964'],
    drafts: [
      { id: '1_8b-v6', file: '.cache/eval/commons-sethlui-full-v6-1b-v1/run-Hp7iM7/candidate.ru.srt',
        sha256: '042c0ffffd67a4ea6f562645655ffe9db823866d7505b4ed64708e0ff829df4d' },
      { id: '7b-v6', file: '.cache/eval/commons-sethlui-json-tail-length-retry-7b-v2/run-mHswjb/candidate.ru.srt',
        sha256: '45f140e201f5a6228a0754e48d1e2b4153a392a7869dc279768339882fa53511' },
    ] },
];
const publicInputs = [
  ['eval/reports/2026-10-10-reg077-v4.json',
    '1cd09c57dcad44e7eadcc1357faaa6cb1d901a620a129fdc845ed6bb6e17e8ae'],
  ['eval/reports/2026-10-10-reg077-v4-ai-review.json',
    '299ef270b466f79f66e3a720c006026e28c4ff8679e08a7ed978d087cb09206d'],
  ['eval/reports/2026-10-10-reg076-v3-ai-review.json',
    '313760eb3c19d82bf6d4f23c8b95c115e1b3805b0623d1667d837537a642434e'],
];
const privateJournal =
  '.cache/eval/reg-077-referent-v4/attempt-VnDmEU/requests.jsonl';
const journalSha = 'eb246cbe4431f972673b2898c80cfabb93b881f305dc3181ac4c326d9c27d5f0';
const pinnedRead = async (file, expected, base) => {
  const bytes = await fs.readFile(path.join(base, file));
  assert.equal(sha(bytes), expected, `Pinned bytes changed: ${file}`);
  return bytes;
};
const ruleBytes = await fs.readFile(path.join(root,
  'eval/scripts/chip-core-warning-v1.mjs'));
const freeze = { schema_version: 1,
  experiment: 'CHIP-CORE-WARNING-2026-10-10-v1',
  split: 'exposed_development_not_holdout',
  rule_sha256: sha(ruleBytes),
  public_inputs: Object.fromEntries(publicInputs),
  private_journal_sha256: journalSha,
  input_groups: inputs.map(item => ({ group: item.group,
    cue_count: item.count, source_sha256: item.source[1],
    drafts: item.drafts.map(draft => ({ id: draft.id,
      sha256: draft.sha256 })) })),
  limits: { offline_attempts: 1, model_calls: 0, asr_calls: 0,
    tts_calls: 0, network_calls: 0, retries: 0,
    selected_reply_cells: 192, complete_draft_pairs: 1728,
    max_pairs: 1920, max_wall_ms: 20000 } };
const freezeBytes = `${JSON.stringify(freeze, null, 2)}\n`;
if (mode === '--freeze') {
  await fs.writeFile(freezePath, freezeBytes, { flag: 'wx' });
  console.log(`Warning screen frozen: ${sha(Buffer.from(freezeBytes))}`);
  process.exit(0);
}
assert.equal(await fs.readFile(freezePath, 'utf8'), freezeBytes);
if (mode === '--preflight') {
  for (const [file, expected] of publicInputs)
    await pinnedRead(file, expected, root);
  await pinnedRead(privateJournal, journalSha, root);
  for (const item of inputs) {
    await pinnedRead(...item.source, roots[item.root]);
    for (const draft of item.drafts)
      await pinnedRead(draft.file, draft.sha256, roots[item.root]);
  }
  console.log('Warning preflight: all exact input identities; zero model calls');
  process.exit(0);
}

async function buildReport() {
  const began = performance.now();
  const [machineBytes, reviewBytes, oldReviewBytes, journalBytes] =
    await Promise.all([
      pinnedRead(...publicInputs[0], root),
      pinnedRead(...publicInputs[1], root),
      pinnedRead(...publicInputs[2], root),
      pinnedRead(privateJournal, journalSha, root),
    ]);
  const machine = JSON.parse(machineBytes);
  const review = JSON.parse(reviewBytes);
  const oldReview = JSON.parse(oldReviewBytes);
  const journal = journalBytes.toString('utf8').trimEnd().split(/\r?\n/u)
    .map(JSON.parse);
  assert.equal(machine.rows.length, 192);
  assert.equal(journal.length, 192);
  const selectedRows = [];
  const semanticKnownCases = new Set(['multiple_chip_count',
    'not_multicore_but_separate_chips',
    'three_independent_not_one_multicore']);
  for (const [index, raw] of journal.entries()) {
    const row = machine.rows[index];
    assert.equal(raw.case_id, row.case_id);
    assert.equal(raw.seed, row.seed);
    assert.equal(raw.arm, row.arm);
    assert.equal(raw.accepted_text_sha256, row.accepted_text_sha256);
    const envelope = JSON.parse(raw.request.messages[0].content
      .split('Input JSON:\n')[1]);
    assert.equal(envelope.target_slots.length, 1);
    const source = envelope.target_slots[0].source_original;
    assert.equal(sha(Buffer.from(source)), row.source_text_sha256);
    const labels = review.new_cases[row.case_id] ??
      oldReview.verdicts[row.case_id];
    assert(labels);
    const seedIndex = review.seed_order.indexOf(row.seed);
    assert(seedIndex >= 0);
    const verdict = labels[row.arm][seedIndex];
    const warnings = chipCoreWarnings(source, raw.accepted_text);
    selectedRows.push({ case_id: row.case_id, seed: row.seed,
      arm: row.arm, source_sha256: row.source_text_sha256,
      accepted_text_sha256: row.accepted_text_sha256,
      source_trigger: explicitNegatedMulticore(source),
      ai_verdict: verdict, warnings,
      known_semantic_error: semanticKnownCases.has(row.case_id) &&
        verdict === 'major_fact_error',
      known_grammar_error: verdict === 'fact_pass_grammar_error' });
  }
  const groups = [];
  for (const item of inputs) {
    const source = parsePinnedSrt(await pinnedRead(...item.source,
      roots[item.root]));
    assert.equal(source.length, item.count);
    const drafts = [];
    for (const draft of item.drafts) {
      const target = parsePinnedSrt(await pinnedRead(draft.file,
        draft.sha256, roots[item.root]));
      assert.equal(target.length, source.length);
      const warnings = [];
      for (const [index, cue] of source.entries()) {
        const translated = target[index];
        assert.equal(translated.id, cue.id);
        assert.equal(translated.timing, cue.timing);
        for (const kind of chipCoreWarnings(cue.text, translated.text))
          warnings.push({ cue_id: cue.id, kind });
      }
      drafts.push({ id: draft.id, sha256: draft.sha256, warnings,
        warning_count: warnings.length, human_reviewed_warnings: 0,
        warning_precision: null });
    }
    groups.push({ id: item.group, source_sha256: item.source[1],
      source_cues: source.length,
      source_trigger_cue_ids: source.filter(cue =>
        explicitNegatedMulticore(cue.text)).map(cue => cue.id),
      drafts });
  }
  const count = (kind, predicate) => selectedRows.filter(row =>
    row.warnings.includes(kind) && predicate(row)).length;
  const summary = {
    selected_reply_cells: selectedRows.length,
    complete_draft_pairs: groups.reduce((sum, group) =>
      sum + group.source_cues * group.drafts.length, 0),
    semantic_known_error_cells: selectedRows.filter(row =>
      row.known_semantic_error).length,
    semantic_warning_hits: count('negated_multicore_referent_review',
      () => true),
    semantic_known_error_hits: count('negated_multicore_referent_review',
      row => row.known_semantic_error),
    semantic_ai_false_warnings: count('negated_multicore_referent_review',
      row => !row.known_semantic_error),
    grammar_known_error_cells: selectedRows.filter(row =>
      row.known_grammar_error).length,
    grammar_warning_hits: count('russian_one_core_agreement_review',
      () => true),
    grammar_known_error_hits: count('russian_one_core_agreement_review',
      row => row.known_grammar_error),
    grammar_ai_false_warnings: count('russian_one_core_agreement_review',
      row => !row.known_grammar_error),
    human_bilingual_reviews: 0, human_warning_precision: null,
    product_rule_admitted: false, output_modified: false,
    model_calls: 0, asr_calls: 0, tts_calls: 0, network_calls: 0,
  };
  assert.equal(summary.selected_reply_cells +
    summary.complete_draft_pairs, freeze.limits.max_pairs);
  assert(performance.now() - began <= freeze.limits.max_wall_ms,
    'Offline wall budget exhausted');
  return { schema_version: 1, experiment: freeze.experiment,
    split: freeze.split, freeze_sha256: sha(Buffer.from(freezeBytes)),
    rule_sha256: freeze.rule_sha256,
    public_inputs: freeze.public_inputs,
    private_journal_sha256: journalSha,
    selected_rows: selectedRows, source_groups: groups, summary };
}
if (mode === '--check') {
  const expected = `${JSON.stringify(await buildReport(), null, 2)}\n`;
  assert.equal(await fs.readFile(reportPath, 'utf8'), expected);
  console.log(JSON.stringify({ status: 'verified_offline_warning_screen',
    report_sha256: sha(Buffer.from(expected)),
    selected_reply_cells: 192, complete_draft_pairs: 1728 }));
} else {
  await fs.mkdir(privateParent, { recursive: true });
  const workspace = await fs.mkdtemp(path.join(privateParent, 'attempt-'));
  const attempt = { experiment: freeze.experiment,
    started_at: new Date().toISOString(), status: 'started' };
  try {
    const output = `${JSON.stringify(await buildReport(), null, 2)}\n`;
    await fs.writeFile(reportPath, output, { flag: 'wx' });
    attempt.status = 'captured';
    attempt.report_sha256 = sha(Buffer.from(output));
    attempt.pairs = freeze.limits.max_pairs;
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
