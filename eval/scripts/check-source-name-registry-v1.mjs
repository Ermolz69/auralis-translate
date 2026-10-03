import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const parent = path.join(root,'.cache/eval/source-name-registry-v1/freeze-02');
const digest = value => createHash('sha256').update(value).digest('hex');
const write = process.argv[2] === '--write';
const auditCode = process.argv[2] === '--audit-code';
assert(process.argv.length === 2 || (process.argv.length === 3 && (write || auditCode)));
const guard = JSON.parse(await fs.readFile(path.join(parent,'attempt-started.json')));
assert.equal(path.basename(path.dirname(guard.workspace)),path.basename(parent));
assert.match(path.basename(guard.workspace),/^attempt-[A-Za-z0-9]+$/);
const retainedWorkspace=path.join(parent,path.basename(guard.workspace));
const reportBytes = await fs.readFile(path.join(retainedWorkspace,'report.json'));
const report = JSON.parse(reportBytes);
const frozenBytes = await fs.readFile(path.join(parent,'freeze.json'));
const frozen = JSON.parse(frozenBytes);
const serverLog = await fs.readFile(path.join(retainedWorkspace,'server.stderr.log'));
assert.equal(guard.freeze_sha256,digest(frozenBytes));
assert.equal(report.freeze_sha256,digest(frozenBytes));
assert.deepEqual(report.identities,frozen.identities);
assert.deepEqual(report.budget,frozen.budget);
assert(report.arms.length <= 6);
const observations = [];
let chats = 0,preflights = 0,promptTokens = 0,completionTokens = 0;
for (const arm of report.arms) {
  assert.equal(arm.source_after_sha256,frozen.identities.source_sha256);
  if (arm.status === 'completed') {
    assert.equal(arm.checkpoints.length,14);
    assert.equal(arm.results.length,1);
    assert.equal(arm.results[0].review_state,'needs_review');
    assert.equal(digest(arm.output_text),arm.output_sha256);
    assert.equal(arm.output_sha256,arm.results[0].output_sha256);
    assert.equal(arm.chats,14);
    assert.equal(arm.preflights,28);
    assert.deepEqual(arm.checkpoints.map(c=>c.block_index),Array.from({length:14},(_,i)=>i));
  } else {assert.equal(arm.results?.length ?? 0,0);assert.equal(arm.output_text,null);}
  for (const request of arm.requests??[]) {
    assert.equal(digest(request.rendered_request),request.request_sha256);
    if (request.request_kind !== 'chat_completion') {preflights++;continue;}
    chats++;
    promptTokens+=request.prompt_tokens??0;completionTokens+=request.completion_tokens??0;
    const payload = JSON.parse(request.rendered_request);
    const envelope = JSON.parse(payload.messages[0].content.split('Input JSON:\n')[1]);
    assert.equal(envelope.target_slots.length,1);
    const slot=envelope.target_slots[0];
    assert.equal(slot.segment_id,request.segment_id);
    const hints=slot.name_proposals??[];
    const ids=arm.registries?.length ? JSON.parse(arm.registries[0].payload_json).entities : [];
    for (const hint of hints) {
      const entity=ids.find(e=>e.id===hint.entity_id);
      assert(entity && entity.chinese===hint.source);
      assert.equal(hint.status,'needs_review');
      assert.equal(hint.origin,'model');
      assert(entity.occurrences.some(o=>o.segment_id===slot.segment_id && o.line_index===slot.line_index));
      for (const occurrence of hint.occurrences) {
        assert.equal(Buffer.from(slot.source_original).subarray(occurrence.byte_start,occurrence.byte_end).toString('utf8'),hint.source);
      }
    }
    if ([5,8,9].includes(slot.segment_id)) assert.equal(hints.length,0,'Context or false substring acquired a name');
    assert(!envelope.source_context.some(c=>c.name_proposals),'Context has target-name hints');
    const tokenized=(arm.requests??[]).filter(r=>r.request_kind==='tokenize' && r.segment_id===request.segment_id && r.sequence<request.sequence).at(-1);
    assert(tokenized);
    const tokenCount=JSON.parse(tokenized.raw_response).tokens.length;
    assert.equal(tokenCount,request.prompt_tokens);
    assert(tokenCount+payload.max_tokens+frozen.budget.safety_tokens<=frozen.budget.context_tokens);
    let accepted=null;
    if (request.outcome==='validated_batch') {
      const lines=JSON.parse(request.restored_candidate);
      const checkpoint=arm.checkpoints.find(c=>c.block_index===slot.segment_id-1);
      if (checkpoint) {
        const selected=JSON.parse(checkpoint.accepted_json);
        assert.deepEqual(selected[0].lines,lines);
        accepted=lines[0];
      }
    }
    observations.push({arm_index:arm.index,variant:arm.variant,repetition:arm.repetition,segment_id:slot.segment_id,
      source:slot.source_original,context:envelope.source_context,hints,request_sha256:request.request_sha256,
      raw_response_sha256:request.raw_response===null?null:digest(request.raw_response),
      outcome:request.outcome,accepted,prompt_tokens:request.prompt_tokens,completion_tokens:request.completion_tokens,
      elapsed_ms:request.elapsed_ms,raw_response:request.raw_response,rendered_request:request.rendered_request});
  }
  if (arm.variant==='registry') {
    assert.equal(arm.registries.length,1);assert.equal(arm.bindings.length,1);
    const registry=JSON.parse(arm.registries[0].payload_json);
    assert.equal(registry.entities.length,7);
    const similar=registry.entities.filter(e=>['王宁','王凝'].includes(e.chinese));
    assert.equal(similar.length,2);assert.notEqual(similar[0].id,similar[1].id);
    assert.equal(registry.entities.filter(e=>e.chinese==='王老师').length,2);
    assert(registry.entities.every(e=>e.status==='needs_review' && e.proposal.reviewer_id===null));
  }
}
assert(chats<=frozen.budget.chat_requests && preflights<=frozen.budget.preflight_requests);
assert(promptTokens+completionTokens<=frozen.budget.combined_tokens);
if (report.status==='complete_needs_review') {
  assert.equal(chats,84);assert.equal(preflights,168);
  for (const repetition of [1,2,3]) {
    const baseline=observations.filter(o=>o.variant==='baseline'&&o.repetition===repetition);
    const registry=observations.filter(o=>o.variant==='registry'&&o.repetition===repetition);
    for (const id of [5,8,9]) assert.equal(baseline.find(o=>o.segment_id===id).rendered_request,
      registry.find(o=>o.segment_id===id).rendered_request,'Negative target requests differ');
  }
}
const summary = {schema_version:1,experiment:report.experiment,status:report.status,
  report_sha256:digest(reportBytes),freeze_sha256:digest(frozenBytes),identities:report.identities,budget:report.budget,
  started_at:report.started_at,finished_at:report.finished_at,wall_elapsed_ms:report.wall_elapsed_ms,
  platform:report.platform,code_commit:report.code_commit,dirty_code:true,reviewer_type:'AI self-review, model-visible',human_ratings:0,
  local_utc_offset:'+03:00',errors:report.errors,
  runtime_configuration:{server_args:report.server_args,server_stderr_sha256:digest(serverLog),
    observed_backend_lines:serverLog.toString('utf8').split(/\r?\n/).filter(line=>/offload|CUDA|device|n_ctx|build:/i.test(line)),
    seed:null,seed_reason:'CLI does not expose a seed; repetitions are fresh unseeded runs',
    cache_reason:'Shared server; OS and runtime cache effects are unknown; not a speed benchmark'},
  counters:{chats,preflights,prompt_tokens:promptTokens,completion_tokens:completionTokens,
    checkpoints:report.arms.reduce((sum,a)=>sum+(a.checkpoints?.length??0),0),results:report.arms.reduce((sum,a)=>sum+(a.results?.length??0),0)},
  resources:report.resources,arms:report.arms.map(a=>({index:a.index,variant:a.variant,repetition:a.repetition,status:a.status,
    elapsed_ms:a.elapsed_ms,output_sha256:a.output_sha256,registry_fingerprint:a.registries?.[0]?.fingerprint??null,error:a.error??null})),observations};
const publicPath=path.join(root,'eval/reports/2026-10-03-source-name-registry-v1.json');
if (write) await fs.writeFile(publicPath,`${JSON.stringify(summary,null,2)}\n`,{flag:'wx'});
else assert.deepEqual(JSON.parse(await fs.readFile(publicPath)),summary);
const reviewPath=path.join(root,'eval/reports/2026-10-03-source-name-registry-v1-ai-review.json');
if (!write) {
  const review=JSON.parse(await fs.readFile(reviewPath));
  assert.equal(review.report_sha256,digest(await fs.readFile(publicPath)));
  assert.equal(review.human_ratings,0);
  assert.equal(review.reviewed_observations,observations.length);
  assert.equal(review.rows.length,14);
  for(const row of review.rows) {
    for(const variant of ['baseline','registry']) {
      const selected=observations.filter(o=>o.variant===variant&&o.segment_id===row.segment_id);
      assert.equal(row[variant].length,selected.length);
      assert.equal(selected.length,3);
    }
  }
  assert.equal(review.decision==='advance',review.consistency_improved && review.new_semantic_errors===0 && review.uncertain_regressions===0 && report.status==='complete_needs_review');
}
if(auditCode) {
  let checkoutLineEndings=0;
  for(const identity of frozen.identities.code_hashes) {
    const current=await fs.readFile(path.join(root,identity.path));
    if(digest(current)===identity.sha256) continue;
    const lf=current.toString('utf8').replaceAll('\r\n','\n');
    assert([digest(lf),digest(lf.replaceAll('\n','\r\n'))].includes(identity.sha256),`Changed experiment code: ${identity.path}`);
    checkoutLineEndings++;
  }
  assert.equal(digest(await fs.readFile(path.join(root,'models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_source_names_batch1.experimental.json'))),frozen.identities.registry_profile_sha256);
  console.log(JSON.stringify({frozen_code_files:frozen.identities.code_hashes.length,checkout_line_endings_only:checkoutLineEndings,content_changes:0}));
}
console.log(JSON.stringify({status:'verified',counters:summary.counters,report_status:report.status,publicPath}));
