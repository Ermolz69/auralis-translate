import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePinnedSrt } from './cross-source-relation-screen.mjs';
import { validateScenePostEditReply } from './vivo-scene-post-edit-v1.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assetRoot = process.env.AURALIS_EVAL_ASSET_ROOT;
const modelRoot = process.env.AURALIS_MODEL_ASSET_ROOT;
const mode = process.argv[2];
assert(['--capture', '--check'].includes(mode) && process.argv.length === 3);
assert(assetRoot && path.isAbsolute(assetRoot));
assert(modelRoot && path.isAbsolute(modelRoot));
const privateRoot = path.join(root,
  '.cache/eval/vivo-scene-post-edit-v1/attempt-FKCsLE');
const publicPath = path.join(root,
  'eval/reports/2026-10-10-vivo-scene-post-edit-v1.json');
const pinned = {
  freeze: '1df1121d6cbd858c3baf16838e01d597777e519d5ec321f67f754a6bb2146465',
  raw_report: '957ded8ccc613f7287d2cb81633a3f2e127f32b82e2efcbda9629f03f29689c5',
  raw_journal: '430b591d5401aa373804618eee1e4a076da9a996e628defb5572c5fd5af681f5',
  ai_review: '4d1670f8a7e4ebf3680d9b08017a5f2da67809101d464d7248f9a8014fd28135',
};
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const sourceBase = path.join(assetRoot,
  '.cache/eval/v8-vivo-original-long-v1/attempt-MAaX5T/7b');
const [freezeBytes, rawBytes, journalBytes, reviewBytes,
  sourceBytes, draftBytes, priorBytes, helperBytes, harnessBytes] =
  await Promise.all([
    fs.readFile(path.join(root,
      'eval/experiments/2026-10-10-vivo-scene-post-edit-v1-freeze.json')),
    fs.readFile(path.join(privateRoot, 'report.json')),
    fs.readFile(path.join(privateRoot, 'requests.jsonl')),
    fs.readFile(path.join(root,
      'eval/reports/2026-10-10-vivo-scene-post-edit-v1-ai-review.json')),
    fs.readFile(path.join(sourceBase, 'source.zh.srt')),
    fs.readFile(path.join(sourceBase, 'candidate.ru.srt')),
    fs.readFile(path.join(assetRoot,
      '.cache/eval/source-fact-hints-v1/attempt-HtkAPR/requests.jsonl')),
    fs.readFile(path.join(root, 'eval/scripts/vivo-scene-post-edit-v1.mjs')),
    fs.readFile(path.join(root, 'eval/scripts/probe-vivo-scene-post-edit-v1.mjs')),
  ]);
assert.equal(digest(freezeBytes), pinned.freeze);
assert.equal(digest(rawBytes), pinned.raw_report);
assert.equal(digest(journalBytes), pinned.raw_journal);
assert.equal(digest(reviewBytes), pinned.ai_review);
const freeze = JSON.parse(freezeBytes);
const raw = JSON.parse(rawBytes);
const review = JSON.parse(reviewBytes);
assert.equal(digest(sourceBytes), freeze.pinned.source);
assert.equal(digest(draftBytes), freeze.pinned.draft);
assert.equal(digest(priorBytes), freeze.pinned.prior_journal);
assert.equal(await hashFile(path.join(modelRoot,
  '.cache/models/Hy-MT2-7B-Q4_K_M.gguf')), freeze.pinned.model);
assert.equal(await hashFile(path.join(modelRoot,
  '.cache/runtime/llama/llama-server.exe')), freeze.pinned.runtime);
assert.equal(await hashFile(path.join(root,
  'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch4.experimental.json')),
freeze.pinned.manifest);
assert.equal(digest(helperBytes), freeze.pinned.helper);
assert.equal(digest(harnessBytes), freeze.pinned.harness);
assert.equal(raw.experiment, freeze.experiment);
assert.equal(raw.status, 'complete_structural_observations_unreviewed');
assert.equal(raw.git_head, '5537a8c16a4b50672db37b9834ff72843e81363f');
assert.equal(raw.git_status, '');
assert.equal(raw.freeze_sha256, pinned.freeze);
assert.equal(raw.harness_sha256, freeze.pinned.harness);
assert.equal(raw.helper_sha256, freeze.pinned.helper);
assert.deepEqual(raw.failures, []);
assert.equal(freeze.limits.retries, 0);
assert(raw.wall_elapsed_ms <= freeze.limits.max_wall_ms);
const source = parsePinnedSrt(sourceBytes);
const draft = parsePinnedSrt(draftBytes);
assert.equal(source.length, 467);
assert.equal(draft.length, source.length);
for (let i = 0; i < source.length; i += 1) {
  assert.equal(source[i].id, draft[i].id);
  assert.equal(source[i].timing, draft[i].timing);
}
const prior = priorBytes.toString('utf8').trimEnd().split(/\r?\n/u).map(JSON.parse);
const journal = journalBytes.toString('utf8').trimEnd()
  .split(/\r?\n/u).map(JSON.parse);
assert.equal(prior.length, 36);
assert.equal(journal.length, freeze.limits.chats);
assert.equal(raw.requests.length, journal.length);
assert.equal(review.case_reviews.length, journal.length);
const responseRows = [];
let totalTokens = 0;
let preflights = 0;
for (let index = 0; index < journal.length; index += 1) {
  const entry = journal[index];
  const planned = freeze.requests[index];
  const observed = raw.requests[index];
  const judgment = review.case_reviews[index];
  assert.equal(entry.case_id, planned.case_id);
  assert.equal(judgment.case_id, planned.case_id);
  assert.equal(entry.family, planned.family);
  assert.equal(entry.status, 'valid_unreviewed');
  assert.equal(observed.status, entry.status);
  assert.deepEqual(entry.target_ids, planned.target_ids);
  assert.equal(entry.request_sha256, planned.request_sha256);
  assert.equal(digest(Buffer.from(JSON.stringify(entry.request))),
    planned.request_sha256);
  assert.equal(digest(Buffer.from(entry.request.messages[0].content)),
    planned.prompt_sha256);
  assert.equal(entry.chat.request_sha256, planned.request_sha256);
  assert.equal(entry.chat.http_status, 200);
  assert.equal(entry.finish_reason, 'stop');
  assert.deepEqual(entry.preflight.map(row => row.endpoint),
    ['apply-template', 'tokenize']);
  assert(entry.preflight.every(row => row.http_status === 200));
  const tokenCount = JSON.parse(entry.preflight[1].raw_response).tokens.length;
  assert.equal(tokenCount, entry.prompt_tokens_preflight);
  assert(tokenCount <= freeze.limits.context_tokens -
    freeze.limits.response_tokens - freeze.limits.safety_tokens);
  assert.equal(tokenCount, entry.usage.prompt_tokens);
  const http = JSON.parse(entry.chat.raw_response);
  const parts = entry.request.messages[0].content.split('Input JSON:\n');
  assert.equal(parts.length, 2);
  assert(!parts[0].includes('expected') && !parts[0].includes('reference'));
  const envelope = JSON.parse(parts[1]);
  assert.deepEqual(validateScenePostEditReply(http.choices[0].message.content,
    envelope.target_slots), entry.translations);
  assert.equal(envelope.schema_version, 1);
  assert.deepEqual(envelope.target_slots.map(row => row.segment_id),
    planned.target_ids);
  const inventory = [...envelope.target_slots, ...envelope.source_context]
    .map(({ segment_id, line_index, source_original }) =>
      ({ segment_id, line_index, source_original }))
    .sort((a, b) => a.segment_id - b.segment_id);
  assert.equal(digest(Buffer.from(JSON.stringify(inventory))),
    planned.inventory_sha256);
  assert.equal(digest(Buffer.from(JSON.stringify(envelope.target_slots.map(
    cue => ({ id: cue.segment_id, text: cue.draft_ru }))))),
  planned.baseline_sha256);
  if (entry.family === 'natural') {
    for (const cue of inventory)
      assert.equal(cue.source_original, source[cue.segment_id - 1].text);
    for (const cue of envelope.target_slots)
      assert.equal(cue.draft_ru, draft[cue.segment_id - 1].text);
  } else {
    const earlier = prior.filter(row => row.case_id === entry.case_id &&
      row.arm === 'baseline');
    assert.equal(earlier.length, 1);
    assert.deepEqual(envelope.target_slots.map(cue => cue.draft_ru),
      earlier[0].translations.map(cue => cue.text));
  }
  assert.deepEqual(observed.translations, entry.translations);
  assert.deepEqual(observed.usage, entry.usage);
  assert.equal(observed.chat_elapsed_ms, entry.chat.elapsed_ms);
  totalTokens += entry.usage.prompt_tokens + entry.usage.completion_tokens;
  preflights += entry.preflight.length;
  responseRows.push({ case_id: entry.case_id, family: entry.family,
    target_ids: entry.target_ids,
    changed_cue_ids: envelope.target_slots.filter((cue, cueIndex) =>
      cue.draft_ru !== entry.translations[cueIndex].text)
      .map(cue => cue.segment_id),
    request_sha256: planned.request_sha256,
    prompt_sha256: planned.prompt_sha256,
    baseline_sha256: planned.baseline_sha256,
    raw_http_sha256: digest(Buffer.from(entry.chat.raw_response)),
    candidate_text_sha256: entry.translations.map(cue => ({
      id: cue.segment_id, sha256: digest(Buffer.from(cue.text)) })),
    prompt_tokens_preflight: tokenCount,
    prompt_tokens: entry.usage.prompt_tokens,
    completion_tokens: entry.usage.completion_tokens,
    chat_elapsed_ms: entry.chat.elapsed_ms,
    ai_judgment: judgment.assessment,
    new_major_error: judgment.new_major_error,
    primary_relation_repaired: judgment.primary_relation_repaired });
}
assert.equal(preflights, freeze.limits.preflights);
assert.equal(totalTokens, raw.total_tokens);
assert(totalTokens <= freeze.limits.max_total_tokens);
assert.equal(review.summary.known_primary_relations_confirmed_repaired, 0);
assert.equal(review.summary.new_major_errors, 1);
assert.equal(review.summary.candidate_shortlisted, false);
assert.equal(review.summary.human_bilingual_reviews, 0);
const samples = raw.resources.model_7b.samples;
assert(samples.length > 0);
const workingSet = samples.flatMap(sample => sample.processes ?? [])
  .map(process => process.WorkingSet64 ?? 0);
const gpuUsed = samples.map(sample => {
  const match = /,\s*(\d+),/u.exec(sample.gpu_device ?? '');
  return match ? Number(match[1]) : 0;
});
const report = { schema_version: 1, experiment: freeze.experiment,
  split: freeze.split, source_sha256: freeze.pinned.source,
  baseline_draft_sha256: freeze.pinned.draft,
  model_sha256: freeze.pinned.model,
  runtime_sha256: freeze.pinned.runtime,
  manifest_sha256: freeze.pinned.manifest,
  freeze_sha256: pinned.freeze,
  helper_sha256: freeze.pinned.helper,
  harness_sha256: freeze.pinned.harness,
  private_report_sha256: pinned.raw_report,
  private_journal_sha256: pinned.raw_journal,
  ai_review_sha256: pinned.ai_review,
  chats: journal.length, preflights, total_tokens: totalTokens,
  prompt_tokens: responseRows.reduce((sum, row) => sum + row.prompt_tokens, 0),
  completion_tokens: responseRows.reduce((sum, row) =>
    sum + row.completion_tokens, 0),
  summed_chat_elapsed_ms: responseRows.reduce((sum, row) =>
    sum + row.chat_elapsed_ms, 0),
  wall_elapsed_ms: raw.wall_elapsed_ms,
  resource_samples: samples.length,
  peak_tracked_working_set_bytes: Math.max(...workingSet),
  peak_device_gpu_mib: Math.max(...gpuUsed),
  resource_sample_errors: samples.flatMap(sample => sample.errors ?? []).length,
  responses: responseRows, ai_triage: review.summary,
  human_bilingual_reviews: 0, full_file_rerun: false,
  product_profile_changed: false,
  decision: 'rejected_new_major_time_displacement' };
if (mode === '--capture')
  await fs.writeFile(publicPath, `${JSON.stringify(report, null, 2)}\n`,
    { flag: 'wx' });
else assert.deepEqual(JSON.parse(await fs.readFile(publicPath, 'utf8')),
  report);
console.log(JSON.stringify({ status: mode === '--capture' ? 'captured' : 'verified',
  chats: report.chats, preflights, totalTokens,
  knownRepairs: review.summary.known_primary_relations_confirmed_repaired,
  newMajorErrors: review.summary.new_major_errors, publicPath }));
