import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkBudget, decodeCandidate, resumeIdentity, scopedRequest, sha256 } from './target-term-scope.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const write = process.argv[2] === '--write';
assert(process.argv.length === 2 || (process.argv.length === 3 && write));
const read = relative => fs.readFile(path.join(root,relative));
const parent = '.cache/eval/reg-061-target-terms-v1';
const freezeBytes = await read(`${parent}/frozen-requests.json`);
const frozen = JSON.parse(freezeBytes);
const publicFreeze = JSON.parse(await read('eval/experiments/2026-10-03-reg-061-target-terms-v1-freeze.json'));
assert.equal(sha256(freezeBytes),publicFreeze.private_requests_sha256);
for (const [file,hash] of Object.entries(frozen.sourceHashes)) assert.equal(sha256(await read(file)),hash);
const policy = JSON.parse(await read('eval/profiles/reg-061-target-terms-v1.json'));
const corpus = JSON.parse(await read('eval/regressions/reg-058-provisional-terms-controls-v1.json'));
const regression = JSON.parse(await read('eval/regressions/reg-061-term-hint-contamination-v1.json'));
const controls = [...corpus.controls,...regression.related_controls,...regression.negative_controls];
assert.equal(controls.length,15);
assert.equal(sha256(await read('eval/regressions/reg-058-provisional-terms-controls-v1.json')),frozen.expected.controls);
assert.equal(sha256(await read('eval/regressions/reg-061-term-hint-contamination-v1.json')),frozen.expected.regression);
const planned = frozen.planned[0].rows;
assert.equal(planned.length,30);
for (let index=0;index<15;index++) {
  const pair = planned.slice(index*2,index*2+2);
  const baseline = pair.find(row => row.variant === 'baseline');
  const scoped = pair.find(row => row.variant === 'scoped');
  const expected = scopedRequest(baseline.request,policy);
  assert.deepEqual(scoped.request,expected.request);
  assert.deepEqual(scoped.decisions,expected.decisions);
  assert.equal(scoped.review_state,expected.review_state);
  if (expected.baseline_identical) assert.equal(JSON.stringify(scoped.request),JSON.stringify(baseline.request));
  for (const row of pair) {
    assert.equal(row.control_id,controls[index].id);
    assert.equal(row.request_sha256,sha256(JSON.stringify(row.request)));
    assert.equal(row.resume_identity,resumeIdentity(row.request,frozen.identities));
    assert(!JSON.stringify(row.request).includes(controls[index].expected_meaning));
    const envelope = JSON.parse(row.request.messages[0].content.split('Input JSON:\n')[1]);
    assert.equal(envelope.target_slots.length,1);
    const slot = envelope.target_slots[0];
    assert.equal(slot.source_original,controls[index].source);
    assert.equal(slot.source_for_translation,controls[index].source);
    assert.deepEqual(slot.approved_terms,[]);
    assert.deepEqual(slot.protected_facts,[]);
  }
}
const attempts = (await fs.readdir(path.join(root,parent))).filter(name => name.startsWith('attempt-'));
assert.equal(attempts.length,1);
const privatePath = `${parent}/${attempts[0]}/report.json`;
const rawBytes = await read(privatePath);
const raw = JSON.parse(rawBytes);
assert.equal(raw.experiment,frozen.experiment);
assert.deepEqual(raw.sourceHashes,frozen.sourceHashes);
assert.deepEqual(raw.identities,frozen.identities);
assert.deepEqual(raw.limits,frozen.limits);
assert.equal(raw.private_requests_sha256,sha256(freezeBytes));
assert.equal(raw.checkpoints,0);
assert.equal(raw.published_results,0);
assert.equal(raw.limits.retries,0);
const journalBytes = await read(`${parent}/${attempts[0]}/7b/requests.jsonl`);
const journal = journalBytes.toString('utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
assert(journal.length<=30);
assert.equal(journal.length,raw.arms[0].requests.length);
let preflights = 0;
const rows = journal.map((entry,index) => {
  const plan = planned[index];
  const control = controls.find(row => row.id === entry.control_id);
  assert.deepEqual(entry.request,plan.request);
  assert.equal(entry.variant,plan.variant);
  assert.equal(entry.control_id,plan.control_id);
  assert.equal(entry.resume_identity,plan.resume_identity);
  assert.equal(entry.checkpoint_accepted,false);
  assert.equal(entry.request_sha256,sha256(JSON.stringify(entry.request)));
  for (const preflight of entry.preflight) {
    assert.equal(sha256(preflight.raw_response),preflight.raw_response_sha256);
    assert.equal(preflight.http_status,200);
    preflights++;
  }
  if (entry.preflight.length===2) {
    assert.equal(entry.preflight[0].request_sha256,sha256(JSON.stringify({
      model:entry.request.model,messages:entry.request.messages,response_format:entry.request.response_format})));
    const rendered = JSON.parse(entry.preflight[0].raw_response).prompt;
    assert.equal(entry.preflight[1].request_sha256,sha256(JSON.stringify({
      content:rendered,add_special:false,parse_special:true})));
    const count = JSON.parse(entry.preflight[1].raw_response).tokens.length;
    assert.equal(entry.prompt_tokens_preflight,count);
    checkBudget(count,frozen.limits);
    if (entry.usage) assert.equal(entry.usage.prompt_tokens,count);
  }
  let candidate = null;
  if (entry.chat) {
    assert.equal(entry.chat.request_sha256,entry.request_sha256);
    assert.equal(sha256(entry.chat.raw_response),entry.chat.raw_response_sha256);
    try {candidate = decodeCandidate(entry.chat,{segment_id:plan.cue_id,line_index:0});}
    catch { /* Invalid raw output is retained without a candidate. */ }
  }
  assert.equal(entry.candidate ?? null,candidate);
  assert.equal(entry.structural_outcome === 'accepted_structure_unreviewed_meaning',candidate!==null);
  const summary = raw.arms[0].requests[index];
  assert.equal(summary.raw_response_sha256,entry.chat?.raw_response_sha256 ?? null);
  assert.equal(summary.candidate ?? null,candidate);
  return {id:entry.control_id,variant:entry.variant,source:control.source,
    expected_meaning:control.expected_meaning,candidate,
    structural_outcome:entry.structural_outcome ?? 'aborted',
    scope_decisions:entry.decisions,review_state:entry.review_state,
    baseline_identical:entry.baseline_identical,request_sha256:entry.request_sha256,
    raw_response:entry.chat?.raw_response ?? null,
    raw_response_sha256:entry.chat?.raw_response_sha256 ?? null,
    prompt_tokens:entry.usage?.prompt_tokens ?? null,
    completion_tokens:entry.usage?.completion_tokens ?? null,
    chat_elapsed_ms:entry.chat?.elapsed_ms ?? null,error:entry.error ?? null};
});
const reviewPath = 'eval/reports/2026-10-03-reg-061-target-terms-v1-ai-review.json';
const reviewBytes = await read(reviewPath).catch(error => error.code === 'ENOENT' ? null : Promise.reject(error));
const review = reviewBytes ? JSON.parse(reviewBytes) : null;
let decision = 'pending_AI_review';
if (review) {
  assert.equal(review.reviewer_type,'AI_source_aware_not_independent_human');
  assert.equal(review.private_report_sha256,sha256(rawBytes));
  assert.equal(review.human_bilingual_review_count,0);
  assert.equal(review.rows.length,rows.length);
  assert.equal(new Set(review.rows.map(row => `${row.id}/${row.variant}`)).size,rows.length);
  for (const row of rows) {
    const judgement = review.rows.find(item => item.id===row.id && item.variant===row.variant);
    assert(judgement && ['pass','fail','needs_review'].includes(judgement.fact_verdict));
    assert(judgement.reason);
    assert.equal(judgement.raw_response_sha256,row.raw_response_sha256);
  }
  decision = rows.length===30 && rows.every(row => row.candidate!==null)
    && review.rows.filter(row => row.variant==='scoped').length===15
    && review.rows.filter(row => row.variant==='scoped').every(row => row.fact_verdict==='pass')
      ? 'advance_development_only' : 'reject_keep_product_v8';
}
if (raw.status==='complete_responses_unreviewed') {
  assert.equal(rows.length,30);
  assert.equal(preflights,60);
}
const samples = raw.arms[0].resources?.samples ?? [];
const maxima = values => values.length ? Math.max(...values) : null;
const report = {schema_version:1,experiment:raw.experiment,status:raw.status,decision,
  split:'authored_development_not_holdout',private_report:privatePath,
  private_report_sha256:sha256(rawBytes),journal_sha256:sha256(journalBytes),
  freeze_sha256:sha256(freezeBytes),identities:frozen.identities,sourceHashes:frozen.sourceHashes,
  code_commit:raw.code_commit,dirty_state:raw.dirty_state,started_at:raw.started_at,
  finished_at:raw.finished_at,timezone_offset:raw.timezone_offset,
  wall_elapsed_ms:raw.wall_elapsed_ms,limits:raw.limits,chats:rows.length,preflights,
  structurally_accepted:rows.filter(row=>row.candidate!==null).length,
  identical_pairs:planned.filter(row=>row.variant==='scoped' && row.baseline_identical).length,
  checkpoint_count:0,published_results:0,
  totals:Object.fromEntries(['baseline','scoped'].map(variant=>[variant,
    {prompt_tokens:rows.filter(row=>row.variant===variant).reduce((s,row)=>s+(row.prompt_tokens??0),0),
      completion_tokens:rows.filter(row=>row.variant===variant).reduce((s,row)=>s+(row.completion_tokens??0),0),
      chat_elapsed_ms:rows.filter(row=>row.variant===variant).reduce((s,row)=>s+(row.chat_elapsed_ms??0),0)}])),
  sampled_max_process_working_set_bytes:maxima(samples.flatMap(s=>s.processes.map(p=>p.WorkingSet64)).filter(Number.isFinite)),
  sampled_max_device_gpu_mib:maxima(samples.map(s=>Number(s.gpu_device?.split(', ')[1])).filter(Number.isFinite)),
  resource_sample_count:samples.length,sampling_interval_ms:raw.arms[0].resources?.interval_ms ?? null,
  sampler_errors:samples.flatMap(s=>s.errors??[]),observer_overhead_ms:null,
  observer_overhead_reason:'Not measured; samples are lower-bound process peaks and whole-device GPU use.',
  ai_review_sha256:reviewBytes?sha256(reviewBytes):null,human_bilingual_review_count:0,
  errors:[...raw.errors,...raw.arms.flatMap(arm=>arm.errors)],rows,release_gate:'open'};
const output = `${JSON.stringify(report,null,2)}\n`;
const publicPath = 'eval/reports/2026-10-03-reg-061-target-terms-v1.json';
if (write) await fs.writeFile(path.join(root,publicPath),output);
else assert.equal((await read(publicPath)).toString('utf8'),output);
console.log(`REG-061: ${rows.length} chats, ${preflights} preflights, ${report.identical_pairs} byte-identical pairs; ${decision}.`);
