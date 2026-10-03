import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildReg062, digest, root, writeOrCheckFreeze } from './build-reg-062-occurrences-v1.mjs';
import { checkBudget, decodeCandidate } from './target-term-scope.mjs';

const write = process.argv[2]==='--write';
assert(process.argv.length===2 || (process.argv.length===3 && write));
const read = relative => fs.readFile(path.join(root,relative));
const state = await buildReg062();
await writeOrCheckFreeze(state,'--preflight');
const attempts = (await fs.readdir(state.parent)).filter(name=>name.startsWith('attempt-'));
assert.equal(attempts.length,1,'One retained model attempt is required');
const attempt = attempts[0];
const privatePath = `.cache/eval/reg-062-occurrence-terms-v1/${attempt}/report.json`;
const rawBytes = await read(privatePath);
const raw = JSON.parse(rawBytes);
assert.equal(raw.experiment,state.frozen.experiment);
assert.deepEqual(raw.sourceHashes,state.sourceHashes);
assert.deepEqual(raw.identities,state.identities);
assert.deepEqual(raw.limits,state.limits);
assert.equal(raw.private_requests_sha256,digest(state.frozenBytes));
assert.equal(raw.checkpoints,0);
assert.equal(raw.published_results,0);
assert.equal(raw.limits.retries,0);
assert.equal(raw.arms.length,1);
const journalPath = `.cache/eval/reg-062-occurrence-terms-v1/${attempt}/7b/requests.jsonl`;
const journalBytes = await read(journalPath);
const journal = journalBytes.toString('utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const planned = state.planned[0].rows;
assert(journal.length<=state.limits.maximum_chats);
assert.equal(journal.length,raw.arms[0].requests.length);
let preflights = 0;
const rows = journal.map((entry,index) => {
  const plan = planned[index];
  const facts = state.frozen.cases.find(item=>item.id===plan.control_id);
  assert(facts);
  assert.deepEqual(entry.request,plan.request);
  for (const field of ['case_id','control_id','cue_id','run','role','variant',
    'resume_identity','review_state','baseline_identical','request_sha256'])
    assert.deepEqual(entry[field],plan[field],field);
  assert.deepEqual(entry.decisions,plan.decisions);
  assert.equal(entry.checkpoint_accepted,false);
  assert.equal(entry.request_sha256,digest(JSON.stringify(entry.request)));
  assert.equal(entry.original_reg061_baseline_sha256,
    plan.original_reg061_baseline_sha256);
  for (const preflight of entry.preflight) {
    assert.equal(digest(preflight.raw_response),preflight.raw_response_sha256);
    assert.equal(preflight.http_status,200);
    preflights++;
  }
  if (entry.preflight.length===2) {
    assert.equal(entry.preflight[0].request_sha256,digest(JSON.stringify({
      model:entry.request.model,messages:entry.request.messages,
      response_format:entry.request.response_format})));
    const rendered = JSON.parse(entry.preflight[0].raw_response).prompt;
    assert.equal(entry.preflight[1].request_sha256,digest(JSON.stringify({
      content:rendered,add_special:false,parse_special:true})));
    const count = JSON.parse(entry.preflight[1].raw_response).tokens.length;
    assert.equal(entry.prompt_tokens_preflight,count);
    checkBudget(count,state.limits);
    if (entry.usage) assert.equal(entry.usage.prompt_tokens,count);
  }
  let candidate = null;
  if (entry.chat) {
    assert.equal(entry.chat.request_sha256,entry.request_sha256);
    assert.equal(digest(entry.chat.raw_response),entry.chat.raw_response_sha256);
    try {candidate=decodeCandidate(entry.chat,{segment_id:plan.cue_id,line_index:plan.line_index});}
    catch { /* Invalid raw output remains evidence. */ }
  }
  assert.equal(entry.candidate??null,candidate);
  assert.equal(entry.structural_outcome==='accepted_structure_unreviewed_meaning',candidate!==null);
  const summary = raw.arms[0].requests[index];
  assert.equal(summary.request_sha256,entry.request_sha256);
  assert.equal(summary.raw_response_sha256,entry.chat?.raw_response_sha256??null);
  assert.equal(summary.candidate??null,candidate);
  assert.equal(summary.run,entry.run);
  return {id:entry.control_id,run:entry.run,variant:entry.variant,
    role:entry.role,source:facts.source,source_facts:facts.source_facts,
    candidate,structural_outcome:entry.structural_outcome??'aborted',
    scope_decisions:entry.decisions,review_state:entry.review_state,
    baseline_identical:entry.baseline_identical,
    request_sha256:entry.request_sha256,
    raw_response_sha256:entry.chat?.raw_response_sha256??null,
    prompt_tokens:entry.usage?.prompt_tokens??null,
    completion_tokens:entry.usage?.completion_tokens??null,
    chat_elapsed_ms:entry.chat?.elapsed_ms??null,
    finish_reason:entry.finish_reason??null,error:entry.error??null};
});
if (raw.status==='complete_responses_unreviewed') {
  assert.equal(rows.length,state.limits.maximum_chats);
  assert.equal(preflights,state.limits.maximum_preflights);
}
const reviewPath = 'eval/reports/2026-10-03-reg-062-occurrence-terms-v1-ai-review.json';
const reviewBytes = await read(reviewPath).catch(error=>error.code==='ENOENT'
  ? null : Promise.reject(error));
const review = reviewBytes ? JSON.parse(reviewBytes) : null;
let decision = 'pending_AI_review';
let reviewCounts = null;
if (review) {
  assert.equal(review.experiment,state.frozen.experiment);
  assert.equal(review.reviewer_type,'AI_source_aware_not_independent_human');
  assert.equal(review.private_report_sha256,digest(rawBytes));
  assert.equal(review.human_bilingual_review_count,0);
  assert.equal(review.rows.length,rows.length);
  const reviewByKey = new Map(review.rows.map(item=>[
    `${item.id}/${item.run}/${item.variant}`,item]));
  assert.equal(reviewByKey.size,rows.length);
  for (const row of rows) {
    const item = reviewByKey.get(`${row.id}/${row.run}/${row.variant}`);
    assert(item);
    assert.equal(item.raw_response_sha256,row.raw_response_sha256);
    assert(['pass','fail','needs_review'].includes(item.fact_verdict));
    assert(['none','minor','major','critical','uncertain'].includes(item.severity));
    assert(typeof item.reason==='string' && item.reason.length>4);
    if (item.fact_verdict==='pass') assert.equal(item.severity,'none');
    if (item.fact_verdict==='needs_review') assert.equal(item.severity,'uncertain');
    if (item.fact_verdict==='fail') assert(['minor','major','critical'].includes(item.severity));
  }
  const positives = {
    core:new Set(['multicore_positive','multicore_term_positive']),
    pad:new Set(['mouse_pad_positive','mouse_pad_term_positive'])
  };
  const failures = (variant,ids) => rows.filter(row=>row.variant===variant && ids.has(row.id)
    && reviewByKey.get(`${row.id}/${row.run}/${variant}`).fact_verdict!=='pass').length;
  const positiveImprovement = Object.values(positives).every(ids=>
    failures('occurrence',ids)===0 && failures('baseline',ids)>0);
  const allCandidatePass = rows.filter(row=>row.variant==='occurrence').every(row=>
    reviewByKey.get(`${row.id}/${row.run}/occurrence`).fact_verdict==='pass');
  const fullStructure = rows.length===state.limits.maximum_chats &&
    rows.every(row=>row.candidate!==null);
  decision = fullStructure && positiveImprovement && allCandidatePass
    ? 'advance_experimental_development_only' : 'reject_keep_product_v8';
  reviewCounts = {positive_baseline_failures:Object.fromEntries(Object.entries(positives)
      .map(([key,ids])=>[key,failures('baseline',ids)])),
    positive_occurrence_failures:Object.fromEntries(Object.entries(positives)
      .map(([key,ids])=>[key,failures('occurrence',ids)])),
    candidate_pass:rows.filter(row=>row.variant==='occurrence' &&
      reviewByKey.get(`${row.id}/${row.run}/occurrence`).fact_verdict==='pass').length,
    candidate_fail:rows.filter(row=>row.variant==='occurrence' &&
      reviewByKey.get(`${row.id}/${row.run}/occurrence`).fact_verdict==='fail').length,
    candidate_needs_review:rows.filter(row=>row.variant==='occurrence' &&
      reviewByKey.get(`${row.id}/${row.run}/occurrence`).fact_verdict==='needs_review').length};
}
const samples = raw.arms[0].resources?.samples??[];
const maxima = values => values.length ? Math.max(...values) : null;
const totals = Object.fromEntries(['baseline','occurrence'].map(variant=>[variant,{
  chats:rows.filter(row=>row.variant===variant).length,
  prompt_tokens:rows.filter(row=>row.variant===variant).reduce((n,row)=>n+(row.prompt_tokens??0),0),
  completion_tokens:rows.filter(row=>row.variant===variant).reduce((n,row)=>n+(row.completion_tokens??0),0),
  chat_elapsed_ms:rows.filter(row=>row.variant===variant).reduce((n,row)=>n+(row.chat_elapsed_ms??0),0)
}]));
const report = {schema_version:1,experiment:raw.experiment,status:raw.status,decision,
  split:'authored_development_not_holdout',private_report:privatePath,
  private_report_sha256:digest(rawBytes),journal_sha256:digest(journalBytes),
  freeze_sha256:digest(state.frozenBytes),identities:state.identities,
  sourceHashes:state.sourceHashes,code_commit:raw.code_commit,
  dirty_state:raw.dirty_state,started_at:raw.started_at,
  finished_at:raw.finished_at,timezone_offset:raw.timezone_offset,
  wall_elapsed_ms:raw.wall_elapsed_ms,limits:state.limits,chats:rows.length,
  preflights,structurally_accepted:rows.filter(row=>row.candidate!==null).length,
  identical_pairs:rows.filter(row=>row.variant==='occurrence' && row.baseline_identical).length,
  checkpoint_count:0,published_results:0,totals,review_counts:reviewCounts,
  sampled_max_process_working_set_bytes:maxima(samples.flatMap(sample=>
    sample.processes.map(process=>process.WorkingSet64)).filter(Number.isFinite)),
  sampled_max_device_gpu_mib:maxima(samples.map(sample=>
    Number(sample.gpu_device?.split(', ')[1])).filter(Number.isFinite)),
  resource_sample_count:samples.length,
  sampling_interval_ms:raw.arms[0].resources?.interval_ms??null,
  sampler_errors:samples.flatMap(sample=>sample.errors??[]),
  observer_overhead_ms:null,
  observer_overhead_reason:'Not measured; samples are lower-bound process peaks and whole-device GPU use.',
  ai_review_sha256:reviewBytes?digest(reviewBytes):null,human_bilingual_review_count:0,
  errors:[...raw.errors,...raw.arms.flatMap(arm=>arm.errors)],rows,
  release_gate:'open'};
const output = `${JSON.stringify(report,null,2)}\n`;
const publicPath = 'eval/reports/2026-10-03-reg-062-occurrence-terms-v1.json';
if (write) await fs.writeFile(path.join(root,publicPath),output);
else assert.equal((await read(publicPath)).toString('utf8'),output);
console.log(`REG-062: ${rows.length} chats, ${preflights} preflights; ${decision}.`);
