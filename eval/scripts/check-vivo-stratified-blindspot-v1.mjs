import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePinnedSrt } from './cross-source-relation-screen.mjs';
import { selectVivoBlindspotWindows } from './vivo-blindspot-selector-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT;
const mode = process.argv[2];
assert(['--preflight', '--capture', '--check'].includes(mode) &&
  process.argv.length === 3);
assert(assetRoot && path.isAbsolute(assetRoot));
const sourceBase = path.join(assetRoot,
  '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/7b');
const oneBPath = path.join(assetRoot,
  '.cache/eval/reg065-vivo-copy-recovery-v1/attempt-mVbgXB/candidate.ru.srt');
const freezePath = path.join(root,
  'eval/experiments/2026-10-10-vivo-stratified-blindspot-v1-freeze.json');
const reportPath = path.join(root,
  'eval/reports/2026-10-10-vivo-stratified-blindspot-v1.json');
const privateParent = path.join(root,
  '.cache/eval/vivo-stratified-blindspot-v1');
const pinned = {
  source: 'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4',
  sevenB: '4451868ea3e7cbb3ed81f3d24b5f85bc61a749168b213c54c88ae552208c4831',
  oneB: '32d96fe75eb0f5c90a67e2f6606d3d6ace27f79e67352a12b065efe91a08d3fc',
  freeze: 'ac2536f4878de123d50a89fbc35f7d383f93f9709dc19acf14c14f376d6413cc',
};
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function loadInputs() {
  const [sourceBytes, sevenBBytes, oneBBytes, freezeBytes, selectorBytes,
    selectionHarnessBytes, pairedHarnessBytes] = await Promise.all([
    fs.readFile(path.join(sourceBase, 'source.zh.srt')),
    fs.readFile(path.join(sourceBase, 'candidate.ru.srt')),
    fs.readFile(oneBPath), fs.readFile(freezePath),
    fs.readFile(path.join(root, 'eval/scripts/vivo-blindspot-selector-v1.mjs')),
    fs.readFile(path.join(root, 'eval/scripts/freeze-vivo-blindspot-v1.mjs')),
    fs.readFile(fileURLToPath(import.meta.url)),
  ]);
  for (const [bytes, expected, label] of [
    [sourceBytes, pinned.source, 'Chinese source'],
    [sevenBBytes, pinned.sevenB, '7B draft'],
    [oneBBytes, pinned.oneB, '1.8B draft'],
    [freezeBytes, pinned.freeze, 'source-only selection'],
  ]) assert.equal(digest(bytes), expected, `${label} identity changed`);
  const freeze = JSON.parse(freezeBytes);
  assert.equal(freeze.source_sha256, pinned.source);
  assert.equal(freeze.selector_sha256, digest(selectorBytes));
  assert.equal(freeze.selection_harness_sha256,
    digest(selectionHarnessBytes));
  assert.equal(freeze.draft_files_opened_during_selection, 0);
  const source = parsePinnedSrt(sourceBytes);
  const sevenB = parsePinnedSrt(sevenBBytes);
  const oneB = parsePinnedSrt(oneBBytes);
  assert.equal(source.length, 467);
  assert.equal(sevenB.length, 467);
  assert.equal(oneB.length, 467);
  for (let index = 0; index < source.length; index += 1) {
    for (const draft of [sevenB, oneB]) {
      assert.equal(draft[index].id, source[index].id,
        'source/draft cue identity changed');
      assert.equal(draft[index].timing, source[index].timing,
        'source/draft timing changed');
    }
  }
  assert.deepEqual(selectVivoBlindspotWindows(source).windows,
    freeze.windows);
  assert.equal(freeze.unique_source_cues, 45);
  assert.equal(freeze.planned_source_target_pairs, 90);
  return { source, sevenB, oneB, freeze,
    pairedHarnessSha256: digest(pairedHarnessBytes) };
}

function buildPacket({ source, sevenB, oneB, freeze }) {
  const windows = freeze.windows.map(window => {
    const sourceCues = window.cue_ids.map(id => source[id - 1]);
    const drafts = { sevenB: window.cue_ids.map(id => sevenB[id - 1]),
      oneB: window.cue_ids.map(id => oneB[id - 1]) };
    const contextIds = [window.start - 2, window.start - 1,
      window.end + 1, window.end + 2].filter(id =>
      id >= 1 && id <= source.length);
    const context = contextIds.map(id => source[id - 1]);
    assert.equal(digest(Buffer.from(JSON.stringify(sourceCues.map(
      ({ id, timing, text }) => ({ id, timing, text }))))),
      window.source_window_sha256);
    for (const cue of sourceCues)
      assert.equal(digest(Buffer.from(cue.text)),
        window.source_text_sha256.find(row => row.id === cue.id)?.sha256);
    return { third: window.third, kind: window.kind,
      feature_met: window.feature_met, start: window.start,
      end: window.end, source_cues: sourceCues,
      source_context: context, drafts };
  });
  return { schema_version: 1, experiment: freeze.experiment,
    source_sha256: pinned.source, drafts_sha256: {
      oneB: pinned.oneB, sevenB: pinned.sevenB },
    windows, human_bilingual_reviews: 0 };
}

function publicReport(packet, inputs, attemptName, packetSha256) {
  const rows = packet.windows.map(window => ({
    third: window.third, kind: window.kind,
    feature_met: window.feature_met, start: window.start,
    end: window.end, cue_ids: window.source_cues.map(cue => cue.id),
    source_text_sha256: window.source_cues.map(cue => ({ id: cue.id,
      sha256: digest(Buffer.from(cue.text)) })),
    drafts_text_sha256: Object.fromEntries(Object.entries(window.drafts)
      .map(([arm, cues]) => [arm, cues.map(cue => ({ id: cue.id,
        sha256: digest(Buffer.from(cue.text)) }))])) }));
  return { schema_version: 1, experiment: packet.experiment,
    split: inputs.freeze.split,
    source_sha256: pinned.source, draft_sha256: {
      oneB: pinned.oneB, sevenB: pinned.sevenB },
    freeze_sha256: pinned.freeze,
    paired_harness_sha256: inputs.pairedHarnessSha256,
    private_attempt: attemptName, private_packet_sha256: packetSha256,
    source_cues: 467, selected_windows: rows.length,
    unique_source_cues: new Set(rows.flatMap(row => row.cue_ids)).size,
    source_target_pairs: rows.reduce((total, row) =>
      total + row.cue_ids.length * 2, 0),
    arms: ['oneB', 'sevenB'], windows: rows,
    model_requests: 0, asr_requests: 0, tts_requests: 0,
    human_bilingual_reviews: 0, quality_score: null,
    product_profile_changed: false, release_gate: 'open' };
}

const inputs = await loadInputs();
if (mode === '--preflight') {
  console.log(JSON.stringify({ status: 'verified_frozen_source_and_drafts',
    source_cues: inputs.source.length,
    draft_cues: [inputs.oneB.length, inputs.sevenB.length],
    selected_windows: inputs.freeze.windows.length }));
} else if (mode === '--capture') {
  await fs.mkdir(privateParent, { recursive: true });
  const workspace = await fs.mkdtemp(path.join(privateParent, 'attempt-'));
  const attemptName = path.basename(workspace);
  const attempt = { experiment: inputs.freeze.experiment,
    started_at: new Date().toISOString(), status: 'started' };
  try {
    const started = performance.now();
    const packet = buildPacket(inputs);
    const packetBytes = Buffer.from(`${JSON.stringify(packet, null, 2)}\n`);
    await fs.writeFile(path.join(workspace, 'packet.json'), packetBytes,
      { flag: 'wx' });
    const report = publicReport(packet, inputs, attemptName,
      digest(packetBytes));
    assert.equal(report.selected_windows, 15);
    assert.equal(report.unique_source_cues, 45);
    assert.equal(report.source_target_pairs, 90);
    assert(performance.now() - started <= 20_000,
      'offline paired replay exceeded frozen wall budget');
    await fs.writeFile(reportPath,
      `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
    attempt.status = 'captured';
    attempt.packet_sha256 = digest(packetBytes);
    attempt.report_sha256 = digest(Buffer.from(
      `${JSON.stringify(report, null, 2)}\n`));
    console.log(JSON.stringify({ status: attempt.status,
      private_attempt: workspace,
      packet_sha256: attempt.packet_sha256,
      report_sha256: attempt.report_sha256,
      source_target_pairs: report.source_target_pairs }));
  } catch (error) {
    attempt.status = 'failed';
    attempt.error = String(error);
    throw error;
  } finally {
    attempt.finished_at = new Date().toISOString();
    await fs.writeFile(path.join(workspace, 'attempt.json'),
      `${JSON.stringify(attempt, null, 2)}\n`, { flag: 'wx' });
  }
} else {
  const raw = await fs.readFile(reportPath);
  const recorded = JSON.parse(raw);
  const packetBytes = await fs.readFile(path.join(privateParent,
    recorded.private_attempt, 'packet.json'));
  assert.equal(digest(packetBytes), recorded.private_packet_sha256);
  const packet = buildPacket(inputs);
  assert.deepEqual(JSON.parse(packetBytes), packet);
  assert.deepEqual(recorded, publicReport(packet, inputs,
    recorded.private_attempt, digest(packetBytes)));
  console.log(JSON.stringify({ status: 'verified_paired_blindspot_packet',
    report_sha256: digest(raw), selected_windows: recorded.selected_windows,
    source_target_pairs: recorded.source_target_pairs }));
}
