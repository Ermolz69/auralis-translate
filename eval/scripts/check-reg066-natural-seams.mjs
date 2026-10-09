import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT ?? root;
const capture = process.argv.length === 3 && process.argv[2] === '--capture';
assert(process.argv.length === 2 || capture);
const privateRoot = path.join(root,
  '.cache/eval/reg066-natural-seams-v1/attempt-JfV5tQ');
const publicPath = path.join(root,
  'eval/reports/2026-10-09-reg066-natural-seams.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const [rawBytes, journalBytes, freezeBytes, harnessBytes] = await Promise.all([
  fs.readFile(path.join(privateRoot, 'report.json')),
  fs.readFile(path.join(privateRoot, 'requests.jsonl')),
  fs.readFile(path.join(root,
    'eval/experiments/2026-10-09-reg066-natural-seams-freeze.json')),
  fs.readFile(path.join(root, 'eval/scripts/probe-reg066-natural-seams.mjs')),
]);
const privateSha = '230c09a7b6aec5c91120f022ee5ed1bd74a20f12269b5db46e0da798c258dc6b';
const journalSha = 'fcea60a832f1a7f1d37b2f97e5ce048642f9825d11227a24fadbac49e10a0e2a';
assert.equal(digest(rawBytes), privateSha);
assert.equal(digest(journalBytes), journalSha);
const raw = JSON.parse(rawBytes);
const freeze = JSON.parse(freezeBytes);
const journal = journalBytes.toString('utf8').trimEnd().split('\n').map(JSON.parse);
assert.equal(raw.experiment, freeze.experiment);
assert.equal(raw.status, 'complete_with_invalid_responses_unreviewed');
assert.equal(raw.git_head, '8e47352213ce3121b4e19d30a2970c68f299c995');
assert.equal(raw.git_status, '');
assert.equal(raw.harness_sha256, digest(harnessBytes));
assert.equal(raw.freeze_sha256, digest(freezeBytes));
assert.deepEqual(raw.planned_requests, freeze.requests);
assert.deepEqual(raw.failures, []);
assert.equal(raw.limits.retries, 0);
assert.equal(raw.limits.seed, 101);
assert(raw.wall_elapsed_ms <= raw.limits.max_wall_ms);
assert(raw.total_tokens <= raw.limits.max_total_tokens);
assert.equal(raw.requests.length, 30);
assert.equal(journal.length, 30);
assert.equal(freeze.requests.length, 30);
assert.equal(raw.pinned.runtime, await hashFile(path.join(assetRoot,
  '.cache/runtime/llama/llama-server.exe')));
for (const [file, expected] of [
  ['.cache/eval/youtube-geekerwan-vivo-original-caption/attempt-LQWxgw/source.zh.srt',
    raw.pinned.source],
  ['.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/report.json',
    raw.pinned.original],
  ['.cache/eval/reg066-authored-v8-screen-v1/attempt-LDeHdv/requests.jsonl',
    raw.pinned.prior_journal],
  ['eval/regressions/reg-066-vivo-v8-cross-model-facts-v1.json', raw.pinned.pack],
]) assert.equal(await hashFile(path.join(root, file)), expected);
for (const model of freeze.models) {
  const filename = model.id === '1_8b' ? 'Hy-MT2-1.8B-Q4_K_M.gguf'
    : 'Hy-MT2-7B-Q4_K_M.gguf';
  const manifest = model.id === '1_8b'
    ? 'hy_mt2_1_8b_q4_k_m.context_v8_target_first_batch4.experimental.json'
    : 'hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json';
  assert.equal(await hashFile(path.join(assetRoot, '.cache/models', filename)),
    model.sha256);
  assert.equal(await hashFile(path.join(root, 'models/manifests', manifest)),
    model.manifest_sha256);
}
const observations = [];
let tokens = 0;
let invalid = 0;
for (const [index, entry] of journal.entries()) {
  const plan = freeze.requests[index];
  const summary = raw.requests[index];
  for (const key of ['model', 'case_id', 'kind', 'variant', 'focus',
    'focus_segment_ids', 'source_ids', 'request_sha256', 'prompt_sha256']) {
    assert.deepEqual(entry[key], plan[key], key);
    assert.deepEqual(summary[key], plan[key], key);
  }
  assert.equal(digest(Buffer.from(JSON.stringify(entry.request))),
    plan.request_sha256);
  assert.equal(entry.request.seed, 101);
  assert.equal(entry.preflight.length, 2);
  assert.deepEqual(entry.preflight.map(row => row.endpoint),
    ['apply-template', 'tokenize']);
  const prompt = entry.request.messages[0].content;
  const pieces = prompt.split('Input JSON:\n');
  assert.equal(pieces.length, 2);
  assert(!/\p{Script=Cyrillic}/u.test(pieces[1]));
  assert.equal(digest(Buffer.from(prompt)), plan.prompt_sha256);
  const envelope = JSON.parse(pieces[1]);
  assert.equal(envelope.schema_version, 7);
  assert.deepEqual(envelope.target_slots.map(row => row.segment_id),
    plan.source_ids);
  assert(envelope.target_slots.every(slot => slot.source_original ===
    slot.source_for_translation && slot.approved_terms.length === 0 &&
    slot.protected_facts.length === 0));
  if (plan.kind === 'natural') {
    assert(envelope.target_slots.some(slot => slot.segment_id === plan.focus));
    assert(envelope.source_context.length >= 1 &&
      envelope.source_context.length <= 2);
  } else assert.deepEqual(envelope.source_context, []);
  const template = entry.preflight[0];
  const tokenize = entry.preflight[1];
  assert.equal(template.http_status, 200);
  assert.equal(tokenize.http_status, 200);
  assert.equal(tokenize.request.content, JSON.parse(template.raw_response).prompt);
  const tokenCount = JSON.parse(tokenize.raw_response).tokens.length;
  assert.equal(tokenCount, entry.prompt_tokens_preflight);
  assert.equal(tokenCount, entry.usage.prompt_tokens);
  assert(tokenCount <= raw.limits.context_tokens -
    raw.limits.response_tokens - raw.limits.safety_tokens);
  assert.equal(entry.chat.http_status, 200);
  assert.equal(entry.chat.request_sha256, plan.request_sha256);
  assert.equal(entry.finish_reason, 'stop');
  assert.equal(JSON.parse(entry.chat.raw_response).choices[0].message.content,
    entry.raw_candidate);
  assert.equal(summary.status, entry.status);
  assert.equal(summary.preflight_count, 2);
  assert.deepEqual(summary.translations, entry.translations ?? null);
  if (entry.status === 'valid_unreviewed') {
    const translated = JSON.parse(entry.raw_candidate).translations;
    assert.deepEqual(translated, entry.translations);
    assert.deepEqual(translated.map(row => row.segment_id), plan.source_ids);
  } else {
    assert.equal(entry.status, 'invalid_unreviewed');
    assert.equal(plan.kind, 'natural');
    assert.equal(plan.focus, 466);
    assert.equal(plan.variant, 'shifted');
    assert(!entry.translations);
    assert(entry.validation_error.includes('Expected values to be strictly deep-equal'));
    invalid += 1;
  }
  tokens += entry.usage.prompt_tokens + entry.usage.completion_tokens;
  observations.push({ model: plan.model, case_id: plan.case_id,
    kind: plan.kind, variant: plan.variant, focus_cue: plan.focus,
    focus_segment_ids: plan.focus_segment_ids, target_ids: plan.source_ids,
    request_sha256: plan.request_sha256,
    prompt_sha256: plan.prompt_sha256,
    raw_http_sha256: digest(Buffer.from(entry.chat.raw_response)),
    raw_candidate_sha256: digest(Buffer.from(entry.raw_candidate)),
    status: entry.status,
    translated_ids: entry.translations?.map(row => row.segment_id) ?? null,
    translations_sha256: entry.translations
      ? digest(Buffer.from(JSON.stringify(entry.translations))) : null,
    validation_error: entry.validation_error ?? null,
    prompt_tokens: entry.usage.prompt_tokens,
    completion_tokens: entry.usage.completion_tokens,
    chat_elapsed_ms: entry.chat.elapsed_ms });
}
assert.equal(invalid, 2);
assert.equal(tokens, raw.total_tokens);
assert.equal(journal.reduce((sum, entry) => sum + entry.preflight.length, 0), 60);
const findRaw = (model, caseId, variant) => journal.find(row =>
  row.model === model && row.case_id === caseId && row.variant === variant);
const french = findRaw('1_8b', 'natural_60', 'shifted');
assert(french.translations.find(row => row.segment_id === 60).text
  .includes('génération'));
for (const [model, variant] of [
  ['1_8b', 'original'], ['7b', 'shifted']])
  assert(!findRaw(model, 'natural_60', variant).translations
    .find(row => row.segment_id === 60).text.includes('génération'));
for (const model of ['1_8b', '7b']) {
  const tail = findRaw(model, 'natural_466', 'shifted');
  assert.equal(tail.status, 'invalid_unreviewed');
  assert.deepEqual(JSON.parse(tail.raw_candidate).translations
    .map(row => row.segment_id), [464, 465, 466]);
}
for (const left of journal.filter(row => row.model === '1_8b')) {
  const right = journal.find(row => row.model === '7b' &&
    row.case_id === left.case_id && row.variant === left.variant);
  assert(right);
  const paired = structuredClone(right.request);
  paired.model = left.request.model;
  assert.deepEqual(paired, left.request);
}
const resources = Object.fromEntries(Object.entries(raw.resources).map(([model, sample]) => [
  model, {
    max_sampled_working_set_bytes: Math.max(...sample.samples.flatMap(row =>
      row.processes.map(item => item.WorkingSet64))),
    max_sampled_device_mib: Math.max(...sample.samples.map(row =>
      Number(row.gpu_device.split(',')[1].trim()))),
    limitations: sample.limitations,
  },
]));
const publicReport = { schema_version: 1, experiment: raw.experiment,
  split: freeze.split, source_sha256: raw.pinned.source,
  raw_private_report_sha256: privateSha, raw_private_journal_sha256: journalSha,
  freeze_sha256: digest(freezeBytes), harness_sha256: digest(harnessBytes),
  git_head_at_inference: raw.git_head, limits: raw.limits,
  status: raw.status, wall_elapsed_ms: raw.wall_elapsed_ms,
  chat_requests: raw.requests.length, template_token_preflights: 60,
  structurally_valid: 28, structurally_invalid: 2,
  total_prompt_completion_tokens: tokens, resources, observations,
  language_review_state: 'ai_triage_pending', human_bilingual_reviews: 0,
  release_admission: false };
const output = `${JSON.stringify(publicReport, null, 2)}\n`;
assert(!/[\p{Script=Han}\p{Script=Cyrillic}]/u.test(output));
assert(!output.includes('"translations"'));
if (capture) {
  await fs.writeFile(publicPath, output, { flag: 'wx' });
  console.log(`REG-066 natural seams captured: ${digest(Buffer.from(output))}`);
} else {
  assert.equal(await fs.readFile(publicPath, 'utf8'), output);
  console.log('REG-066 natural seams checked: 30 raw chats, 60 preflights, two retained invalid replies.');
}
