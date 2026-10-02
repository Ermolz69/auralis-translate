import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv.length === 3 && process.argv[2] === '--write';
assert(process.argv.length === 2 || write, 'Only --write is supported');
const currentPath = path.join(root,
  '.cache/eval/v8-7b-authored-v1/attempt-RgNA32/report.json');
const priorPath = path.join(root,
  '.cache/eval/v8-authored-batch-v1/attempt-GdrV2t/report.json');
const publicPath = path.join(root, 'eval/reports/2026-10-02-v8-7b-authored-cli.json');
const sourcePath = path.join(root, 'eval/corpora/v7-batch-development-v1.zh.srt');
const manifestPath = path.join(root,
  'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const [raw, priorRaw, sourceBytes, manifestBytes] = await Promise.all([
  fs.readFile(currentPath), fs.readFile(priorPath),
  fs.readFile(sourcePath), fs.readFile(manifestPath),
]);
const privateSha = 'faeac62597857b05ffa8783dd5fcf2d8e292ceddbb41645baa8c351bc1fadba5';
const priorSha = 'ecdf4d7e02190a5b81e8fd06c0477c7bb5219076ad2138a91dbd9d15f912ee52';
assert.equal(digest(raw), privateSha);
assert.equal(digest(priorRaw), priorSha);
const report = JSON.parse(raw);
const prior = JSON.parse(priorRaw);
assert.equal(report.experiment, 'v8-7b-authored-v1');
assert.equal(report.status, 'completed');
assert.equal(report.code_commit, '04398697e9c8a118443b33802f99bfbab747abc7');
assert.equal(report.errors.length, 0);
assert.deepEqual(report.arms.map(arm => arm.size), [4]);
assert(report.wall_ms <= report.budget.max_wall_ms);
assert.equal(report.identities.source_sha256, digest(sourceBytes));
assert.equal(report.identities.source_sha256,
  'ad88b2d2f96b153d5d8880175b321167263d7abaae48ca693d89b925459bc8a7');
assert.equal(report.identities.manifest_sha256, digest(manifestBytes));
assert.equal(report.identities.manifest_sha256,
  'c287c53efbb4ce78471b64648ea3dd2f521363df0e168b7a61df1fdd6ae0479a');
assert.equal(report.identities.model_sha256,
  '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b');
assert.equal(report.identities.runtime_sha256, prior.identities.runtime_sha256);
assert.equal(report.identities.cli_sha256, prior.identities.cli_sha256);
const manifest = JSON.parse(manifestBytes);
assert.equal(manifest.prompt_version, 8);
assert.equal(manifest.model_file_sha256, report.identities.model_sha256);
assert.equal(manifest.target_segments_per_block, 4);
const arm = report.arms[0];
const priorArm = prior.arms.find(row => row.size === 4);
assert.equal(arm.status, 'completed');
assert.equal(arm.exit_code, 0);
assert.equal(arm.chat_requests, 1);
assert.equal(arm.requests.length, 3);
assert.equal(arm.checkpoints.length, 1);
assert.equal(arm.results.length, 1);
assert.equal(arm.results[0].review_state, 'needs_review');
assert.equal(arm.source_after_sha256, report.identities.source_sha256);
assert.equal(arm.output_sha256, digest(Buffer.from(arm.output_text)));
assert.equal(arm.output_sha256, arm.results[0].output_sha256);
const sourceTimes = sourceBytes.toString('utf8')
  .match(/\d\d:\d\d:\d\d,\d{3} --> \d\d:\d\d:\d\d,\d{3}/gu);
const outputTimes = arm.output_text
  .match(/\d\d:\d\d:\d\d,\d{3} --> \d\d:\d\d:\d\d,\d{3}/gu);
assert.deepEqual(outputTimes, sourceTimes);
const cues = arm.output_text.trimEnd().split(/\r?\n\r?\n/u).map((block, index) => {
  const lines = block.split(/\r?\n/u);
  assert.equal(Number(lines[0]), index + 1);
  return lines[2];
});
assert.equal(cues.length, 4);
const [template, tokenize, chat] = arm.requests;
assert.deepEqual(arm.requests.map(row => row.request_kind),
  ['apply_template', 'tokenize', 'chat_completion']);
assert.equal(template.outcome, 'parsed_preflight_json');
assert.equal(tokenize.outcome, 'parsed_preflight_json');
assert.equal(chat.outcome, 'validated_batch');
const rendered = JSON.parse(template.raw_response).prompt;
assert.equal(JSON.parse(tokenize.rendered_request).content, rendered);
assert.equal(JSON.parse(tokenize.raw_response).tokens.length, chat.prompt_tokens);
assert.equal(digest(Buffer.from(chat.rendered_request)), chat.request_sha256);
const request = JSON.parse(chat.rendered_request);
assert.equal(request.model, manifest.model_alias);
assert.equal(request.messages.length, 1);
const [instruction, input] = request.messages[0].content.split('Input JSON:\n');
assert(instruction && input);
assert(input.startsWith('{"schema_version":7,"target_slots":'));
const envelope = JSON.parse(input);
assert.deepEqual(envelope.target_slots.map(row => row.segment_id), [1, 2, 3, 4]);
assert.equal(request.response_format.schema.properties.translations.maxItems, 4);
for (const cue of cues) assert(!request.messages[0].content.includes(cue));
const response = JSON.parse(chat.raw_response);
assert.equal(response.usage.prompt_tokens, chat.prompt_tokens);
assert.equal(response.usage.completion_tokens, chat.completion_tokens);
assert.equal(response.choices[0].finish_reason, 'stop');
const rawCandidate = JSON.parse(response.choices[0].message.content).translations;
assert.deepEqual(rawCandidate.map(row => row.segment_id), [1, 2, 3, 4]);
assert.deepEqual(JSON.parse(chat.restored_candidate), cues);
const samples = report.resources.samples;
const summary = {
  schema_version: 1,
  experiment: report.experiment,
  task_ids: ['LONG-01', 'EVAL-04'],
  source_split: 'authored_development_not_holdout',
  code_commit: report.code_commit,
  source_sha256: report.identities.source_sha256,
  manifest_sha256: report.identities.manifest_sha256,
  model_sha256: report.identities.model_sha256,
  runtime_sha256: report.identities.runtime_sha256,
  release_cli_sha256: report.identities.cli_sha256,
  prior_1_8b_private_report_sha256: priorSha,
  private_report: '.cache/eval/v8-7b-authored-v1/attempt-RgNA32/report.json',
  private_report_sha256: privateSha,
  status: 'completed_structural_needs_review',
  chat_requests: 1,
  preflight_requests: 2,
  checkpoints: 1,
  results: 1,
  review_state: arm.results[0].review_state,
  source_after_sha256: arm.source_after_sha256,
  output_sha256: arm.output_sha256,
  prompt_tokens: chat.prompt_tokens,
  completion_tokens: chat.completion_tokens,
  chat_http_ms: chat.elapsed_ms,
  cli_elapsed_ms_rounded: Math.round(arm.elapsed_ms),
  wall_ms_rounded: Math.round(report.wall_ms),
  raw_response_sha256: digest(Buffer.from(chat.raw_response)),
  raw_candidate: rawCandidate.map(row => row.text),
  accepted_cues: cues,
  prior_1_8b_cues: priorArm.output_text.trimEnd()
    .split(/\r?\n\r?\n/u).map(block => block.split(/\r?\n/u)[2]),
  resource_observation: {
    samples: samples.length,
    server_working_set_max_observed_bytes: Math.max(...samples.flatMap(sample =>
      sample.processes.filter(process => process.Id === sample.tracked_pids[0])
        .map(process => process.WorkingSet64))),
    gpu_device_max_observed_mib: Math.max(...samples.map(sample =>
      Number(sample.gpu_device.split(',')[1]))),
    limitation: report.resources.limitations,
  },
  human_bilingual_review_count: 0,
  accepted_language_quality: false,
  release_gate: 'open',
};
const renderedSummary = `${JSON.stringify(summary, null, 2)}\n`;
if (write) await fs.writeFile(publicPath, renderedSummary);
else assert.equal(await fs.readFile(publicPath, 'utf8'), renderedSummary);
console.log(`V8 7B real CLI: four cues, one validated batch, full SRT and unchanged source; ${write ? 'wrote' : 'verified'} report.`);
