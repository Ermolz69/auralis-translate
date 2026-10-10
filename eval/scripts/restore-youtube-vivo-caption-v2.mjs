import assert from 'node:assert/strict';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureBoundedProcess } from './bounded-process-capture.mjs';
import { compareSrtVersions, sha256 } from './youtube-vivo-source-version.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourceRoot = process.env.AURALIS_SOURCE_ROOT;
const executable = process.env.AURALIS_TEST_YTDLP;
const mode = process.argv[2];
assert(['--preflight', '--metadata', '--caption-preflight', '--caption',
  '--report', '--check'].includes(mode) && process.argv.length === 3);
assert(sourceRoot && path.isAbsolute(sourceRoot), 'AURALIS_SOURCE_ROOT must be absolute');
assert(executable && path.isAbsolute(executable), 'AURALIS_TEST_YTDLP must be absolute');

const experiment = 'DATA-03-youtube-vivo-caption-restoration-2026-10-10-v2';
const videoId = '_G4e2p1p-is';
const privateRoot = path.join(root, '.cache/eval/youtube-vivo-caption-restoration-v2');
const metadataParent = path.join(privateRoot, 'metadata');
const captionParent = path.join(privateRoot, 'caption');
const publicReport = path.join(root,
  'eval/reports/2026-10-10-youtube-vivo-caption-restoration-v2.json');
const expected = {
  plan: '74e3edb130ac5a89895f3f76f5aaae1c7885fd3aac63c51cd00c9bc452373c3e',
  prior_report: '51a8cfacb56437cb9f87ccff4920a57d9df53c0363752af21da7036882beea3c',
  executable: '52fe3c26dcf71fbdc85b528589020bb0b8e383155cfa81b64dd447bbe35e24b8',
  commons: '8c41e66f52000a5b67ab27bfc319accd11d89290b60e50fc5c60f4ee8230a000',
  media: '7ad0484b31a6788c31632616649c51e6aaf6cdcdd7d90083d88e1d5ee66e1507',
  previous_youtube: 'b100803367b95fa55fc638b1ff39a0abfa0d5b8183ebe58d58b1a87242d9d8c4',
};
const metadataBudget = { invocations: 1, timeout_ms: 90_000,
  output_bytes: 12 * 1024 * 1024, retries: 0, media_downloads: 0 };
const captionBudget = { requests: 1, timeout_ms: 60_000,
  response_bytes: 1024 * 1024, retries: 0, redirects: 0 };
const commonsPath = path.join(sourceRoot,
  '.cache/eval/commons-vivo-979826861/source.zh.srt');
const mediaPath = path.join(sourceRoot,
  '.cache/eval/commons-vivo-media/media-46745446-cc07-4cff-b5e3-f98fe08262f0/source.240p.webm');
const metaArgs = ['--dump-single-json', '--skip-download', '--no-playlist',
  '--no-warnings', '--retries', '0', `https://www.youtube.com/watch?v=${videoId}`];

async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

async function pinned(file, digest) {
  const bytes = await fs.readFile(file);
  assert.equal(sha256(bytes), digest, `${file} changed`);
  return bytes;
}

async function attempts(parent) {
  const names = await fs.readdir(parent).catch(error => {
    if (error.code === 'ENOENT') return [];
    throw error;
  });
  assert(names.every(name => name.startsWith('attempt-')),
    `Unexpected file in ${parent}`);
  return names.sort();
}

async function oneAttempt(parent) {
  const names = await attempts(parent);
  assert.equal(names.length, 1, `Expected one retained attempt in ${parent}`);
  return path.join(parent, names[0]);
}

async function inputs() {
  const [plan, prior, binaryHash, commons, mediaHash] = await Promise.all([
    pinned(path.join(root,
      'eval/experiments/2026-10-10-youtube-vivo-caption-restoration-v2-plan.md'),
    expected.plan),
    pinned(path.join(root, 'eval/reports/youtube-geekerwan-vivo-caption-v1.json'),
      expected.prior_report),
    hashFile(executable),
    pinned(commonsPath, expected.commons),
    hashFile(mediaPath),
  ]);
  assert.equal(binaryHash, expected.executable);
  assert.equal(mediaHash, expected.media);
  const priorReport = JSON.parse(prior);
  assert.equal(priorReport.video_id, videoId);
  assert.equal(priorReport.original_srt_sha256, expected.previous_youtube);
  assert.equal(priorReport.cue_count, 467);
  return { plan_sha256: sha256(plan), prior_report_sha256: sha256(prior),
    binary_sha256: binaryHash, commons, media_sha256: mediaHash,
    prior_report: priorReport };
}

function trackFrom(metadata) {
  assert.equal(metadata.id, videoId);
  assert.equal(metadata.channel_id, 'UCeUJO1H3TEXu2syfAAPjYKQ');
  assert(Math.abs(metadata.duration * 1000 - 1_115_570) <= 2000,
    'Current video duration differs from pinned media by over two seconds');
  const tracks = metadata.subtitles?.['zh-CN']?.filter(track => track.ext === 'srt') ?? [];
  assert.equal(tracks.length, 1, 'Expected one regular Chinese SRT track');
  const url = new URL(tracks[0].url);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'www.youtube.com');
  assert.equal(url.pathname, '/api/timedtext');
  assert.equal(url.searchParams.get('v'), videoId);
  assert.equal(url.searchParams.get('lang'), 'zh-CN');
  assert.equal(url.searchParams.get('fmt'), 'srt');
  return url;
}

const base = await inputs();

if (mode === '--preflight') {
  assert.equal((await attempts(metadataParent)).length, 0);
  assert.equal((await attempts(captionParent)).length, 0);
  console.log(JSON.stringify({ experiment, video_id: videoId,
    source_root: sourceRoot, plan_sha256: base.plan_sha256,
    prior_report_sha256: base.prior_report_sha256,
    executable_sha256: base.binary_sha256,
    commons_sha256: sha256(base.commons), media_sha256: base.media_sha256,
    metadata_budget: metadataBudget, caption_budget: captionBudget }, null, 2));
  process.exit(0);
}

if (mode === '--metadata') {
  assert.equal((await attempts(metadataParent)).length, 0,
    'Metadata budget was already consumed');
  await fs.mkdir(metadataParent, { recursive: true });
  const workspace = await fs.mkdtemp(path.join(metadataParent, 'attempt-'));
  const startedAt = new Date().toISOString();
  const start = performance.now();
  const captured = await captureBoundedProcess({ command: executable,
    args: metaArgs, cwd: root, env: process.env,
    timeoutMs: metadataBudget.timeout_ms,
    maxOutputBytes: metadataBudget.output_bytes });
  await fs.writeFile(path.join(workspace, 'extractor-stdout.json'),
    captured.stdout, { flag: 'wx' });
  await fs.writeFile(path.join(workspace, 'extractor-stderr.txt'),
    captured.stderr, { flag: 'wx' });
  const report = { schema_version: 1, experiment, video_id: videoId,
    plan_sha256: base.plan_sha256, binary_sha256: base.binary_sha256,
    budget: metadataBudget, args: metaArgs, started_at: startedAt,
    finished_at: new Date().toISOString(), elapsed_ms: Math.round(performance.now() - start),
    process: { ...captured.outcome, timed_out: captured.timedOut,
      output_limit_exceeded: captured.outputLimitExceeded,
      stdout_bytes: captured.stdout.length, stderr_bytes: captured.stderr.length,
      stdout_sha256: sha256(captured.stdout), stderr_sha256: sha256(captured.stderr) },
    accepted_for_caption: false, metadata: null, error: null };
  if (captured.outcome.exit_code === 0 && !captured.timedOut &&
      !captured.outputLimitExceeded) {
    try {
      const value = JSON.parse(captured.stdout.toString('utf8'));
      trackFrom(value);
      report.metadata = { title: value.title ?? null,
        channel_id: value.channel_id, upload_date: value.upload_date ?? null,
        duration_seconds: value.duration, license: value.license ?? null,
        regular_zh_cn_srt: true,
        automatic_zh_cn_available: Boolean(value.automatic_captions?.['zh-CN']) };
      report.accepted_for_caption = true;
    } catch (error) { report.error = String(error); }
  } else report.error = 'Metadata process did not complete within budget';
  await fs.writeFile(path.join(workspace, 'metadata-attempt.json'),
    `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ attempt: workspace, status: report.accepted_for_caption ?
    'metadata_accepted_for_caption' : 'metadata_rejected',
  process: report.process, metadata: report.metadata, error: report.error }, null, 2));
  if (!report.accepted_for_caption) process.exitCode = 1;
  process.exit();
}

async function savedMetadata() {
  const workspace = await oneAttempt(metadataParent);
  const [reportBytes, rawBytes] = await Promise.all([
    fs.readFile(path.join(workspace, 'metadata-attempt.json')),
    fs.readFile(path.join(workspace, 'extractor-stdout.json')),
  ]);
  const report = JSON.parse(reportBytes);
  assert.equal(report.experiment, experiment);
  assert.equal(report.plan_sha256, base.plan_sha256);
  assert.equal(report.process.stdout_sha256, sha256(rawBytes));
  return { workspace, report, reportBytes, rawBytes };
}

if (mode === '--caption-preflight' || mode === '--caption') {
  const saved = await savedMetadata();
  assert.equal(saved.report.accepted_for_caption, true,
    'Metadata did not admit the caption request');
  const url = trackFrom(JSON.parse(saved.rawBytes));
  assert.equal((await attempts(captionParent)).length, 0,
    'Caption budget was already consumed');
  if (mode === '--caption-preflight') {
    console.log(JSON.stringify({ experiment, metadata_attempt: path.basename(saved.workspace),
      metadata_sha256: sha256(saved.rawBytes), caption_url_sha256: sha256(Buffer.from(url.href)),
      source_host: url.hostname, source_path: url.pathname,
      caption_budget: captionBudget }, null, 2));
    process.exit(0);
  }
  await fs.mkdir(captionParent, { recursive: true });
  const workspace = await fs.mkdtemp(path.join(captionParent, 'attempt-'));
  const startedAt = new Date().toISOString();
  const start = performance.now();
  const report = { schema_version: 1, experiment, video_id: videoId,
    metadata_attempt: path.basename(saved.workspace),
    metadata_sha256: sha256(saved.rawBytes),
    caption_url_sha256: sha256(Buffer.from(url.href)),
    source_host: url.hostname, source_path: url.pathname,
    budget: captionBudget, started_at: startedAt, http_status: null,
    content_type: null, response_bytes: null, response_sha256: null,
    outcome: 'running', error: null };
  try {
    const response = await fetch(url, { redirect: 'manual',
      signal: AbortSignal.timeout(captionBudget.timeout_ms) });
    report.http_status = response.status;
    report.content_type = response.headers.get('content-type');
    const reader = response.body?.getReader();
    assert(reader, 'Caption response has no body');
    let received = 0;
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > captionBudget.response_bytes) {
        await reader.cancel();
        throw new Error('Caption response exceeded the byte budget');
      }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks, received);
    report.response_bytes = received;
    report.response_sha256 = sha256(bytes);
    await fs.writeFile(path.join(workspace,
      response.status === 200 ? 'source.zh.srt' : 'http-body.bin'),
    bytes, { flag: 'wx' });
    assert.equal(response.status, 200, `Caption GET returned HTTP ${response.status}`);
    assert(received > 0, 'Caption response is empty');
    report.outcome = 'acquired_private_unreviewed';
  } catch (error) {
    report.outcome = 'failed';
    report.error = String(error);
    process.exitCode = 1;
  } finally {
    report.finished_at = new Date().toISOString();
    report.elapsed_ms = Math.round(performance.now() - start);
    await fs.writeFile(path.join(workspace, 'caption-attempt.json'),
      `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
    console.log(JSON.stringify({ attempt: workspace, ...report }, null, 2));
  }
  process.exit();
}

const metadata = await savedMetadata();
const captionNames = await attempts(captionParent);
assert(captionNames.length <= 1, 'More than one caption attempt');
const captionWorkspace = captionNames.length ? path.join(captionParent, captionNames[0]) : null;
const captionReportBytes = captionWorkspace ?
  await fs.readFile(path.join(captionWorkspace, 'caption-attempt.json')) : null;
const captionReport = captionReportBytes ? JSON.parse(captionReportBytes) : null;
let comparison = null;
let status = 'metadata_failed';
let comparisonError = null;
if (metadata.report.accepted_for_caption) {
  status = 'caption_not_attempted';
  if (captionReport) {
    status = 'caption_failed';
    assert.equal(captionReport.metadata_sha256, sha256(metadata.rawBytes));
    if (captionReport.outcome === 'acquired_private_unreviewed') {
      const bytes = await fs.readFile(path.join(captionWorkspace, 'source.zh.srt'));
      assert.equal(sha256(bytes), captionReport.response_sha256);
      try {
        comparison = compareSrtVersions(bytes, base.commons, 1_115_570,
          expected.previous_youtube);
        status = comparison.previous_youtube_byte_identical ?
          'restored_exact_previous_youtube_bytes' : 'changed_youtube_caption_version';
      } catch (error) {
        comparisonError = String(error);
        status = 'invalid_youtube_caption_response';
      }
    }
  }
}
const result = { schema_version: 1, experiment, video_id: videoId,
  plan_sha256: base.plan_sha256, prior_report_sha256: base.prior_report_sha256,
  commons_sha256: sha256(base.commons), media_sha256: base.media_sha256,
  previous_youtube_sha256: expected.previous_youtube,
  metadata_attempt: path.basename(metadata.workspace),
  metadata_attempt_sha256: sha256(metadata.reportBytes),
  metadata_raw_sha256: sha256(metadata.rawBytes),
  metadata_started_at: metadata.report.started_at,
  metadata_finished_at: metadata.report.finished_at,
  metadata_elapsed_ms: metadata.report.elapsed_ms,
  metadata_process: metadata.report.process,
  metadata_accepted_for_caption: metadata.report.accepted_for_caption,
  metadata_summary: metadata.report.metadata,
  caption_attempt: captionWorkspace ? path.basename(captionWorkspace) : null,
  caption_attempt_sha256: captionReportBytes ? sha256(captionReportBytes) : null,
  caption_started_at: captionReport?.started_at ?? null,
  caption_finished_at: captionReport?.finished_at ?? null,
  caption_elapsed_ms: captionReport?.elapsed_ms ?? null,
  caption_http_status: captionReport?.http_status ?? null,
  caption_response_sha256: captionReport?.response_sha256 ?? null,
  caption_response_bytes: captionReport?.response_bytes ?? null,
  caption_error: captionReport?.error ?? null,
  comparison, comparison_error: comparisonError, status, human_speech_reviews: 0,
  caption_authorship_verified: false, audio_rights_verified: false,
  source_admitted: false, product_translation_changed: false };
const serialized = `${JSON.stringify(result, null, 2)}\n`;
if (mode === '--report') {
  await fs.writeFile(publicReport, serialized, { flag: 'wx' });
  console.log(`Retained public source-version report: ${publicReport}`);
} else assert.equal(await fs.readFile(publicReport, 'utf8'), serialized);
console.log(JSON.stringify({ status, comparison,
  metadata_attempt: result.metadata_attempt,
  caption_attempt: result.caption_attempt }, null, 2));
