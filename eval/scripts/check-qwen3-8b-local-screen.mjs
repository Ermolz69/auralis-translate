import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodeTechnicalSenseReply } from './vivo-technical-senses-v2.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const runRoot = path.join(root,
  '.cache/eval/qwen3-8b-local-screen-v1/attempt-6QiVtF');
const freezePath = path.join(root,
  'eval/experiments/2026-10-10-qwen3-8b-local-screen-freeze.json');
const reportPath = path.join(root,
  'eval/reports/2026-10-10-qwen3-8b-local-screen-v1.json');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const [freezeBytes, privateFreezeBytes, journalBytes, rawReportBytes] =
  await Promise.all([
    fs.readFile(freezePath),
    fs.readFile(path.join(root,
      '.cache/eval/qwen3-8b-local-screen-v1/freeze.json')),
    fs.readFile(path.join(runRoot, 'requests.jsonl')),
    fs.readFile(path.join(runRoot, 'report.json')),
  ]);
assert.equal(sha(freezeBytes),
  '6bc9a8b2c1f04f6717cd0e3e7fa27652fd31aacb28b54be9fac3de449bbef975');
const frozen = JSON.parse(freezeBytes);
assert.equal(sha(privateFreezeBytes), frozen.private_freeze_sha256);
const privateFreeze = JSON.parse(privateFreezeBytes);
assert.equal(privateFreeze.planned.length, 36);
const rows = journalBytes.toString('utf8').trimEnd().split(/\r?\n/u)
  .map(JSON.parse);
const rawReport = JSON.parse(rawReportBytes);
assert.equal(rawReport.status, 'complete_structural_observations_unreviewed');
assert.equal(rawReport.public_freeze_sha256, sha(freezeBytes));
assert.equal(rows.length, 36);
assert.equal(rawReport.requests.length, 36);
assert.equal(rawReport.failures.length, 0);
assert.equal(rows.reduce((sum, row) => sum + row.preflight.length, 0), 72);
assert.deepEqual(rows.map(row => row.arm), [
  ...Array(18).fill('candidate'), ...Array(18).fill('baseline')]);
const expectedByKey = new Map(privateFreeze.planned.map(item =>
  [`${item.arm}/${item.case_id}/${item.seed}`, item]));
const observed = rows.map((row, index) => {
  const expected = expectedByKey.get(`${row.arm}/${row.case_id}/${row.seed}`);
  assert(expected);
  assert.equal(row.status, 'valid_unreviewed');
  assert.equal(row.request_sha256, expected.request_sha256);
  assert.equal(sha(Buffer.from(JSON.stringify(row.request))),
    row.request_sha256);
  assert.equal(row.source_text_sha256, expected.source_text_sha256);
  assert.equal(row.source_inventory_sha256, expected.source_inventory_sha256);
  assert.equal(row.preflight.length, 2);
  assert(row.preflight.every(result => result.http_status === 200));
  assert.equal(row.chat.http_status, 200);
  assert.equal(row.chat.request_sha256, row.request_sha256);
  assert.equal(decodeTechnicalSenseReply(row.chat.raw_response,
    row.target_id), row.accepted_text);
  assert.equal(sha(Buffer.from(row.accepted_text)),
    row.accepted_text_sha256);
  assert.equal(rawReport.requests[index].request_sha256,
    row.request_sha256);
  assert.equal(rawReport.requests[index].accepted_text_sha256,
    row.accepted_text_sha256);
  assert(Number.isInteger(row.usage.prompt_tokens));
  assert(Number.isInteger(row.usage.completion_tokens));
  return { case_id: row.case_id, family: row.family, arm: row.arm,
    seed: row.seed, target_id: row.target_id,
    source_text_sha256: row.source_text_sha256,
    source_inventory_sha256: row.source_inventory_sha256,
    request_sha256: row.request_sha256,
    prompt_sha256: row.prompt_sha256,
    raw_http_sha256: sha(Buffer.from(row.chat.raw_response)),
    raw_candidate_sha256: sha(Buffer.from(row.raw_candidate)),
    accepted_text_sha256: row.accepted_text_sha256,
    restored_candidate: false, validation: row.status,
    prompt_tokens_preflight: row.prompt_tokens_preflight,
    prompt_tokens: row.usage.prompt_tokens,
    completion_tokens: row.usage.completion_tokens,
    preflight_elapsed_ms: row.preflight.map(item => item.elapsed_ms),
    chat_elapsed_ms: row.chat.elapsed_ms };
});
assert.equal(new Set(observed.map(row =>
  `${row.arm}/${row.case_id}/${row.seed}`)).size, 36);
const totalTokens = observed.reduce((sum, row) => sum + row.prompt_tokens +
  row.completion_tokens, 0);
assert.equal(totalTokens, rawReport.total_tokens);
assert(totalTokens <= frozen.limits.max_total_tokens);
assert(rawReport.wall_elapsed_ms <= frozen.limits.max_wall_ms);
const armTotals = Object.fromEntries(['candidate', 'baseline'].map(arm => {
  const selected = observed.filter(row => row.arm === arm);
  const samples = rawReport.resources[arm].samples;
  assert(samples.length > 0 && samples.every(row => row.errors.length === 0));
  const workingSet = samples.flatMap(row => row.processes.map(
    process => process.WorkingSet64));
  const deviceMiB = samples.map(row => {
    const match = /, (\d+), (\d+)$/u.exec(row.gpu_device);
    assert(match && Number(match[2]) === 8192);
    return Number(match[1]);
  });
  return [arm, { chats: selected.length,
    prompt_tokens: selected.reduce((sum, row) => sum + row.prompt_tokens, 0),
    completion_tokens: selected.reduce((sum, row) =>
      sum + row.completion_tokens, 0),
    summed_chat_elapsed_ms: selected.reduce((sum, row) =>
      sum + row.chat_elapsed_ms, 0),
    resource_samples: samples.length,
    sampled_server_max_working_set_bytes: Math.max(...workingSet),
    sampled_whole_device_max_used_mib: Math.max(...deviceMiB) }];
}));
const result = { schema_version: 1,
  experiment: frozen.experiment,
  split: frozen.split,
  status: 'complete_structural_observations_unreviewed',
  reviewer: { kind: 'none_for_machine_report', human_count: 0 },
  source_media: 'private_original_platform_vivo_18m36',
  public_freeze_sha256: sha(freezeBytes),
  private_freeze_sha256: sha(privateFreezeBytes),
  private_journal_sha256: sha(journalBytes),
  private_report_sha256: sha(rawReportBytes),
  first_pre_spawn_failure: {
    code: 'EPERM', stage: 'git_identity_before_model_start',
    requests: 0, model_starts: 0,
    private_record_sha256:
      '26d5062a11141d91c0c20a2f1eca71c0cebb58fc15729366cfb28e0eb3353382',
  },
  pinned: frozen.pinned, limits: frozen.limits,
  git_head: rawReport.git_head, git_status_at_probe: rawReport.git_status,
  started_at: rawReport.started_at,
  finished_at: rawReport.finished_at,
  wall_elapsed_ms: rawReport.wall_elapsed_ms,
  total_tokens: totalTokens,
  request_count: observed.length,
  preflight_count: observed.length * 2,
  failure_count: 0,
  arm_totals: armTotals,
  resource_limit: '5-second samples; GPU memory is whole-device, not model-only',
  requests: observed };
const output = `${JSON.stringify(result, null, 2)}\n`;
if (process.argv[2] === '--capture')
  await fs.writeFile(reportPath, output, { flag: 'wx' });
else {
  assert.equal(process.argv.length, 2);
  assert.equal(await fs.readFile(reportPath, 'utf8'), output);
}
console.log(`Qwen3 matched screen checked: ${observed.length} valid replies, ${totalTokens} tokens, zero human ratings.`);
