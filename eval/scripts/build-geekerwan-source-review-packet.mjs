import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = resolve('.');
const cli = join(root, 'target/debug/auralis-translation-cli.exe');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = [
  {
    id: 'vivo-mediatek', cueCount: 467,
    srt: '.cache/eval/commons-vivo-979826861/source.zh.srt',
    srtSha256: '8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000',
    media: '.cache/eval/commons-vivo-media/media-46745446-cc07-4cff-b5e3-f98fe08262f0/source.240p.webm',
    mediaSha256: '7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507',
    sampleReport: '.cache/eval/commons-vivo-audio/samples-09fb4fd3-3a89-4c5e-a2b1-fc0c90f35dad/report.json',
    sampleReportSha256: 'a16598d0684c1069bf8a2472dca600e6eadd5bc59158e861e3db72c563a8bdcb',
  },
  {
    id: 'asus-rog-ally', cueCount: 268,
    srt: '.cache/eval/commons-asus-rog-ally-892592485/source.zh.srt',
    srtSha256: '923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b',
    media: '.cache/eval/commons-geekerwan-two-media/asus-rog-ally-fd0d9bf6-f2b4-4329-a8cf-ad0b5becf72e/source.240p.webm',
    mediaSha256: '9e4271f8112de2fa65ad67c4cec3390529e916d70363bc5f4c421f4479b97cc1',
    sampleReport: '.cache/eval/commons-geekerwan-two-media/asus-rog-ally-fd0d9bf6-f2b4-4329-a8cf-ad0b5becf72e/check-026ac974-f541-4200-8d9d-23449cba0c2b/report.json',
    sampleReportSha256: 'fb7a77c840cb2fffd6be2a5301cf698b7dd098c5a553f81b0790f4715b471b91',
  },
  {
    id: 'huawei-kirin-9010', cueCount: 304,
    srt: '.cache/eval/commons-huawei-kirin-9010-880535591/source.zh.srt',
    srtSha256: '57dfd9feb3bfe6381421c4142820b780af341e195e52ee81d58e8f9f12858feb',
    media: '.cache/eval/commons-geekerwan-two-media/huawei-kirin-9010-8b5d98b9-25ac-42bd-a32a-ac318a97a1c2/source.240p.webm',
    mediaSha256: '2911c8a14b6da9fa62d46235aa09a1b240ee1409ec8e28336edc7ed90c9af586',
    sampleReport: '.cache/eval/commons-geekerwan-two-media/huawei-kirin-9010-8b5d98b9-25ac-42bd-a32a-ac318a97a1c2/check-80102f0f-30d9-40fa-8102-568e5628f20b/report.json',
    sampleReportSha256: 'af3e6699478be47d03412722e0501687a9046618018c1c99bc1eebc24f440211',
  },
];
const packet = {
  schema_version: 1, id: 'geekerwan-three-source-audio-review-v1',
  created_at: new Date().toISOString(),
  review_state: 'unreviewed', human_review_count: 0,
  instructions: [
    'Listen to the original audio with the matching Chinese cue text and timing.',
    'For each window, record audible language, approximate cue alignment, speaker count and discrepancies.',
    'Give reviewer identity, date and coverage in a separate signed review; do not overwrite this source packet.',
  ],
  sources: [],
};
packet.cli_sha256 = hash(await readFile(cli));

for (const source of sources) {
  const srt = join(root, source.srt);
  const media = join(root, source.media);
  assert.equal(hash(await readFile(srt)), source.srtSha256);
  assert.equal(hash(await readFile(media)), source.mediaSha256);
  const reportBytes = await readFile(join(root, source.sampleReport));
  assert.equal(hash(reportBytes), source.sampleReportSha256);
  const report = JSON.parse(reportBytes);
  assert.equal(report.status, 'decoded_unlistened');
  assert.equal(report.clips.length, 3);
  const { stdout, stderr } = await run(cli, ['--json', 'inspect', srt],
    { cwd: root, timeout: 30_000, maxBuffer: 2 * 1024 * 1024 });
  assert.equal(stderr.trim(), '');
  const envelope = JSON.parse(stdout);
  const inspected = envelope.report?.report;
  assert.equal(envelope.command, 'inspect');
  assert.equal(envelope.terminal?.event, 'completed');
  assert.equal(inspected.format, 'srt');
  assert.equal(inspected.source_sha256, source.srtSha256);
  assert.equal(inspected.segments.length, source.cueCount);
  const samples = [];
  for (const clip of report.clips) {
    const bytes = await readFile(clip.path);
    assert.equal(hash(bytes), clip.sha256);
    const startMs = clip.seconds * 1000;
    const endMs = startMs + 12_000;
    const cues = inspected.segments.filter(cue => cue.start_ms < endMs
      && cue.end_ms > startMs).map(cue => ({
      cue_id: cue.cue_id, start_ms: cue.start_ms, end_ms: cue.end_ms,
      text_slots: cue.text_slots.map(slot => slot.text),
    }));
    assert(cues.length > 0, `${source.id}/${clip.label}: no overlapping source cues`);
    samples.push({ label: clip.label, requested_window_ms: [startMs, endMs],
      decoded_duration_ms: clip.decoded_duration_ms ?? null,
      audio_path: clip.path, audio_sha256: clip.sha256, cues });
  }
  packet.sources.push({ id: source.id, srt_sha256: source.srtSha256,
    media_sha256: source.mediaSha256, sample_report_sha256: source.sampleReportSha256,
    cue_count: source.cueCount, samples });
}
assert.equal(packet.sources.length, 3);
assert.equal(packet.sources.reduce((n, source) => n + source.samples.length, 0), 9);
const directory = join(root, '.cache/eval/geekerwan-source-review',
  `packet-${randomUUID()}`);
await mkdir(directory, { recursive: true });
const packetPath = join(directory, 'packet.json');
await writeFile(packetPath, `${JSON.stringify(packet, null, 2)}\n`, { flag: 'wx' });
console.log(JSON.stringify({ path: packetPath, sha256: hash(await readFile(packetPath)),
  sources: 3, audio_windows: 9, human_reviews: 0 }));
