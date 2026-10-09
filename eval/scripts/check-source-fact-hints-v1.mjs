import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSourceFactHintPrompt } from './source-fact-hints-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT ?? root;
const capture = process.argv.length === 3 && process.argv[2] === '--capture';
assert(process.argv.length === 2 || capture);
const privateRoot = path.join(root,
  '.cache/eval/source-fact-hints-v1/attempt-HtkAPR');
const publicPath = path.join(root,
  'eval/reports/2026-10-09-source-fact-hints-v1.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const [reportBytes, journalBytes, freezeBytes, harnessBytes, extractorBytes] =
  await Promise.all([
    fs.readFile(path.join(privateRoot, 'report.json')),
    fs.readFile(path.join(privateRoot, 'requests.jsonl')),
    fs.readFile(path.join(root,
      'eval/experiments/2026-10-09-source-fact-hints-v1-freeze.json')),
    fs.readFile(path.join(root, 'eval/scripts/probe-source-fact-hints-v1.mjs')),
    fs.readFile(path.join(root, 'eval/scripts/source-fact-hints-v1.mjs')),
  ]);
const privateReportSha = '0334451b07855052aa4a316b08e81d4a94d1d36fe857e20c39fe05dbd95e8729';
const journalSha = '72e52f740ffa1b4dce7e88168a6872eb2687ab44e1f39fd19e0316a10b8f767f';
assert.equal(digest(reportBytes), privateReportSha);
assert.equal(digest(journalBytes), journalSha);
const report = JSON.parse(reportBytes);
const freeze = JSON.parse(freezeBytes);
const journal = journalBytes.toString('utf8').trimEnd().split('\n').map(JSON.parse);
assert.equal(report.experiment, freeze.experiment);
assert.equal(report.status, 'complete_structural_observations_unreviewed');
assert.equal(report.git_head, '5b25b7735fe91c447fc7b9f28f04d6a9c28094f6');
assert.equal(report.git_status, '');
assert.equal(report.harness_sha256, digest(harnessBytes));
assert.equal(report.extractor_sha256, digest(extractorBytes));
assert.equal(report.freeze_sha256, digest(freezeBytes));
assert.deepEqual(report.planned_requests, freeze.requests);
assert.deepEqual(report.failures, []);
assert.equal(report.limits.seed, 101);
assert.equal(report.limits.retries, 0);
assert(report.wall_elapsed_ms <= report.limits.max_wall_ms);
assert(report.total_tokens <= report.limits.max_total_tokens);
assert.equal(report.requests.length, 36);
assert.equal(journal.length, 36);
assert.equal(freeze.requests.length, 36);
for (const [relative, expected] of [
  ['.cache/eval/youtube-geekerwan-vivo-original-caption/attempt-LQWxgw/source.zh.srt',
    freeze.pinned.source],
  ['.cache/eval/reg066-natural-seams-v1/attempt-JfV5tQ/requests.jsonl',
    freeze.pinned.prior_journal],
  ['eval/regressions/reg-066-vivo-v8-cross-model-facts-v1.json',
    freeze.pinned.reg066],
  ['eval/regressions/reg-067-vivo-shifted-tail-id-omission-v1.json',
    freeze.pinned.reg067],
  ['eval/regressions/reg-068-vivo-shifted-mixed-script-v1.json',
    freeze.pinned.reg068],
]) assert.equal(await hashFile(path.join(root, relative)), expected);
assert.equal(await hashFile(path.join(assetRoot,
  '.cache/runtime/llama/llama-server.exe')), freeze.pinned.runtime);
assert.equal(await hashFile(path.join(assetRoot,
  '.cache/models/Hy-MT2-7B-Q4_K_M.gguf')), freeze.model.sha256);
assert.equal(await hashFile(path.join(root,
  'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json')),
freeze.model.manifest_sha256);
const observations = [];
let tokenTotal = 0;
let jsonStructureLeaks = 0;
for (const [index, entry] of journal.entries()) {
  const plan = freeze.requests[index];
  const summary = report.requests[index];
  for (const key of ['case_id', 'family', 'arm', 'hinted_slots',
    'repeated_natural_request', 'target_ids', 'request_sha256',
    'prompt_sha256']) {
    assert.deepEqual(entry[key], plan[key], key);
    assert.deepEqual(summary[key], plan[key], key);
  }
  assert.equal(digest(Buffer.from(JSON.stringify(entry.request))),
    plan.request_sha256);
  assert.equal(entry.request.seed, 101);
  assert.equal(entry.request.model, freeze.model.alias);
  const prompt = entry.request.messages[0].content;
  assert.equal(digest(Buffer.from(prompt)), plan.prompt_sha256);
  const pieces = prompt.split('Input JSON:\n');
  assert.equal(pieces.length, 2);
  assert(!/\p{Script=Cyrillic}/u.test(pieces[1]));
  const envelope = JSON.parse(pieces[1]);
  assert.equal(envelope.schema_version, 7);
  assert.deepEqual(envelope.target_slots.map(row => row.segment_id),
    plan.target_ids);
  if (plan.arm === 'baseline')
    assert(envelope.target_slots.every(slot => !('source_fact_hints' in slot)));
  else assert.equal(envelope.target_slots.filter(slot =>
    'source_fact_hints' in slot).length, plan.hinted_slots);
  assert.equal(entry.preflight.length, 2);
  assert.deepEqual(entry.preflight.map(row => row.endpoint),
    ['apply-template', 'tokenize']);
  const template = entry.preflight[0];
  const tokenize = entry.preflight[1];
  assert.equal(template.http_status, 200);
  assert.equal(tokenize.http_status, 200);
  assert.equal(tokenize.request.content, JSON.parse(template.raw_response).prompt);
  const tokenCount = JSON.parse(tokenize.raw_response).tokens.length;
  assert.equal(tokenCount, entry.prompt_tokens_preflight);
  assert.equal(tokenCount, entry.usage.prompt_tokens);
  assert(tokenCount <= report.limits.context_tokens -
    report.limits.response_tokens - report.limits.safety_tokens);
  assert.equal(entry.chat.http_status, 200);
  assert.equal(entry.chat.request_sha256, plan.request_sha256);
  assert.equal(entry.finish_reason, 'stop');
  assert.equal(JSON.parse(entry.chat.raw_response).choices[0].message.content,
    entry.raw_candidate);
  assert.equal(entry.status, 'valid_unreviewed');
  assert.equal(summary.status, entry.status);
  assert.equal(summary.preflight_count, 2);
  const translations = JSON.parse(entry.raw_candidate).translations;
  assert.deepEqual(translations, entry.translations);
  assert.deepEqual(summary.translations, translations);
  assert.deepEqual(translations.map(row => row.segment_id), plan.target_ids);
  const jsonLeak = translations.some(row => /[{}]/u.test(row.text));
  if (jsonLeak) {
    assert.equal(plan.case_id, 'natural_276');
    assert.equal(plan.arm, 'candidate');
    jsonStructureLeaks += 1;
  }
  tokenTotal += entry.usage.prompt_tokens + entry.usage.completion_tokens;
  observations.push({ case_id: plan.case_id, family: plan.family,
    arm: plan.arm, hinted_slots: plan.hinted_slots,
    repeated_natural_request: plan.repeated_natural_request,
    target_ids: plan.target_ids, request_sha256: plan.request_sha256,
    prompt_sha256: plan.prompt_sha256,
    raw_http_sha256: digest(Buffer.from(entry.chat.raw_response)),
    raw_candidate_sha256: digest(Buffer.from(entry.raw_candidate)),
    translated_ids: translations.map(row => row.segment_id),
    translations_sha256: digest(Buffer.from(JSON.stringify(translations))),
    direct_json_slot_valid: true,
    contains_leaked_json_structure: jsonLeak,
    prompt_tokens: entry.usage.prompt_tokens,
    completion_tokens: entry.usage.completion_tokens,
    chat_elapsed_ms: entry.chat.elapsed_ms });
}
assert.equal(jsonStructureLeaks, 1);
assert.equal(tokenTotal, report.total_tokens);
assert.equal(journal.reduce((sum, row) => sum + row.preflight.length, 0), 72);
let identicalNoHintPairs = 0;
for (const caseId of [...new Set(journal.map(row => row.case_id))]) {
  const baseline = journal.find(row => row.case_id === caseId && row.arm === 'baseline');
  const candidate = journal.find(row => row.case_id === caseId && row.arm === 'candidate');
  assert(baseline && candidate);
  const { prompt, hintedSlots } = renderSourceFactHintPrompt(
    baseline.request.messages[0].content);
  assert.equal(candidate.hinted_slots, hintedSlots);
  assert.equal(candidate.request.messages[0].content, prompt);
  const expected = structuredClone(baseline.request);
  expected.messages[0].content = prompt;
  assert.deepEqual(candidate.request, expected);
  if (hintedSlots === 0) {
    assert.equal(candidate.request_sha256, baseline.request_sha256);
    identicalNoHintPairs += 1;
  } else assert.notEqual(candidate.request_sha256, baseline.request_sha256);
}
assert.equal(identicalNoHintPairs, 5);
const reply = (caseId, arm) => journal.find(row =>
  row.case_id === caseId && row.arm === arm);
const targetText = (caseId, arm, id) => reply(caseId, arm).translations
  .find(row => row.segment_id === id).text;
assert.match(targetText('natural_328', 'baseline', 328),
  /один-двух часов ночи/u);
assert.match(targetText('natural_328', 'candidate', 328),
  /одиннадцати-двенадцати часов ночи/u);
assert(reply('natural_276', 'candidate').translations
  .every(row => /[{}]/u.test(row.text)));
assert(reply('natural_276', 'baseline').translations
  .every(row => !/[{}]/u.test(row.text)));
assert.match(targetText('9400_digit_one_speech_variant', 'baseline', 2053),
  /1-е поколение/u);
assert.match(targetText('9400_digit_one_speech_variant', 'candidate', 2053),
  /модель 9400/u);
const rawResources = report.resources['7b'];
const resources = {
  max_sampled_working_set_bytes: Math.max(...rawResources.samples.flatMap(sample =>
    sample.processes.map(process => process.WorkingSet64))),
  max_sampled_device_mib: Math.max(...rawResources.samples.map(sample =>
    Number(sample.gpu_device.split(',')[1].trim()))),
  limitations: rawResources.limitations,
};
const armUsage = Object.fromEntries(['baseline', 'candidate'].map(arm => {
  const rows = observations.filter(row => row.arm === arm);
  return [arm, { chats: rows.length,
    prompt_tokens: rows.reduce((sum, row) => sum + row.prompt_tokens, 0),
    completion_tokens: rows.reduce((sum, row) => sum + row.completion_tokens, 0),
    summed_chat_http_ms: rows.reduce((sum, row) => sum + row.chat_elapsed_ms, 0) }];
}));
const publicReport = { schema_version: 1, experiment: report.experiment,
  split: freeze.split, source_sha256: freeze.pinned.source,
  raw_private_report_sha256: privateReportSha,
  raw_private_journal_sha256: journalSha,
  freeze_sha256: digest(freezeBytes),
  harness_sha256: digest(harnessBytes), extractor_sha256: digest(extractorBytes),
  git_head_at_inference: report.git_head, started_at: report.started_at,
  finished_at: report.finished_at, limits: report.limits,
  status: report.status, wall_elapsed_ms: report.wall_elapsed_ms,
  chat_requests: 36, template_token_preflights: 72,
  direct_json_slot_valid: 36, json_structure_leak_count: jsonStructureLeaks,
  identical_no_hint_pairs: identicalNoHintPairs,
  total_prompt_completion_tokens: tokenTotal, arm_usage: armUsage,
  resources, observations,
  product_decoder_note: 'Existing v7/v8 provider rejects leaked JSON structure; other direct-chat replies are not claimed as product-accepted.',
  human_bilingual_reviews: 0, candidate_promoted: false };
const output = `${JSON.stringify(publicReport, null, 2)}\n`;
assert(!/[\p{Script=Han}\p{Script=Cyrillic}]/u.test(output));
assert(!output.includes('"translations"'));
const reviewBytes = await fs.readFile(path.join(root,
  'eval/reports/2026-10-09-source-fact-hints-v1-ai-review.json'));
const review = JSON.parse(reviewBytes);
assert.equal(review.machine_report_sha256, digest(Buffer.from(output)));
assert.equal(review.private_journal_sha256, journalSha);
assert.equal(review.reviewer_kind, 'ai_source_aware_self_review');
assert.equal(review.human_bilingual_reviews, 0);
assert.equal(review.target_language_reference_in_model_requests, false);
assert.deepEqual(review.judgments.map(row => row.case_id).sort(),
  [...new Set(journal.map(row => row.case_id))].sort());
assert.equal(review.summary.pairs, 18);
assert.equal(review.summary.exact_no_hint_request_pairs, identicalNoHintPairs);
assert.equal(review.summary.new_natural_major_fact_errors, 1);
assert.equal(review.summary.new_natural_product_decoder_rejections, 1);
assert.equal(review.summary.candidate_promoted, false);
assert(!/[\p{Script=Han}\p{Script=Cyrillic}]/u.test(reviewBytes.toString('utf8')));
if (capture) {
  await fs.writeFile(publicPath, output, { flag: 'wx' });
  console.log(`Source-fact screen captured: ${digest(Buffer.from(output))}`);
} else {
  assert.equal(await fs.readFile(publicPath, 'utf8'), output);
  console.log('Source-fact screen checked: 36 raw chats, 72 preflights, five exact abstentions and one JSON leak.');
}
