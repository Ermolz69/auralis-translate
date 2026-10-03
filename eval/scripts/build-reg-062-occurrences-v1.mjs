import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { occurrenceRequest } from './occurrence-term-scope.mjs';
import { resumeIdentity } from './target-term-scope.mjs';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const parent = path.join(root, '.cache/eval/reg-062-occurrence-terms-v1');
export const frozenPath = path.join(parent, 'frozen-requests.json');
export const publicFreezePath = path.join(root,
  'eval/experiments/2026-10-03-reg-062-occurrence-terms-v1-freeze.json');
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
const read = relative => fs.readFile(path.join(root,relative));
const json = async relative => JSON.parse(await read(relative));

export async function buildReg062() {
  assert.equal(process.platform,'win32');
  const priorBytes = await read('.cache/eval/reg-061-target-terms-v1/frozen-requests.json');
  const priorPublic = await json('eval/experiments/2026-10-03-reg-061-target-terms-v1-freeze.json');
  assert.equal(digest(priorBytes),priorPublic.private_requests_sha256);
  const prior = JSON.parse(priorBytes);
  assert.equal(prior.experiment,'reg-061-target-terms-v1');
  const priorBaseline = new Map(prior.planned[0].rows.filter(row => row.variant==='baseline')
    .map(row => [row.control_id,row]));
  assert.equal(priorBaseline.size,15);

  const files = {
    controls:'eval/regressions/reg-058-provisional-terms-controls-v1.json',
    reg061:'eval/regressions/reg-061-term-hint-contamination-v1.json',
    reg062:'eval/regressions/reg-062-contrast-referent-contamination-v1.json',
    extras:'eval/corpora/reg-062-occurrence-terms-extra-v1.json',
    policy:'eval/profiles/reg-062-occurrence-terms-v1.json'
  };
  const [oldControls,reg061,reg062,extras,policy] = await Promise.all(
    Object.values(files).map(json));
  assert.equal(oldControls.controls.length,10);
  assert.equal(reg061.related_controls.length+reg061.negative_controls.length,5);
  assert.equal(reg062.related_controls.length+reg062.negative_controls.length,3);
  assert.equal(extras.cases.length,2);
  const controls = [
    ...oldControls.controls,
    ...[...reg061.related_controls,...reg061.negative_controls]
      .map(row => ({...row,role:'REG061_followup'})),
    ...[...reg062.related_controls,...reg062.negative_controls]
      .map(row => ({...row,role:'REG062_unrun'})),
    ...extras.cases
  ];
  assert.equal(controls.length,policy.limits.development_cues);
  assert.equal(new Set(controls.map(row=>row.id)).size,controls.length);
  const assetRoot = process.env.AURALIS_TERM_ASSET_ROOT ?? root;
  assert(path.isAbsolute(assetRoot));
  const runtimePath = path.join(assetRoot,'.cache/runtime/llama/llama-server.exe');
  const modelPath = path.join(assetRoot,'.cache/models/Hy-MT2-7B-Q4_K_M.gguf');
  const manifestPath = path.join(root,
    'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch1.experimental.json');
  const [modelHash,runtimeHash,manifestHash] = await Promise.all([
    hashFile(modelPath),hashFile(runtimePath),hashFile(manifestPath)]);
  assert.equal(modelHash,'9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b');
  assert.equal(runtimeHash,'6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
  assert.equal(manifestHash,'a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc');
  const manifest = JSON.parse(await fs.readFile(manifestPath));
  assert.equal(manifest.model_file_sha256,modelHash);
  assert.equal(manifest.target_segments_per_block,1);
  const sourceFiles = [...Object.values(files),
    'eval/scripts/occurrence-term-scope.mjs',
    'eval/scripts/build-reg-062-occurrences-v1.mjs',
    'eval/scripts/probe-reg-062-occurrences-v1.mjs',
    'eval/scripts/local-process.mjs','eval/scripts/runtime-sampler.mjs',
    'eval/experiments/2026-10-03-reg-062-occurrence-terms-v1-plan.md',
    'docs/reference/provisional-target-terms-v2.md'];
  const sourceHashes = Object.fromEntries(await Promise.all(sourceFiles.map(async file =>
    [file,await hashFile(path.join(root,file))])));
  const expected = {prior_freeze_sha256:digest(priorBytes),
    files:Object.fromEntries(Object.entries(files).map(([key,file])=>[key,sourceHashes[file]]))};
  const identities = {
    source_sha256:prior.identities.source_sha256,
    model_sha256:modelHash,runtime_sha256:runtimeHash,
    manifest_sha256:manifestHash,
    policy_sha256:sourceHashes[files.policy],
    implementation_sha256:sourceHashes['eval/scripts/occurrence-term-scope.mjs'],
    corpus_sha256:sourceHashes[files.extras]
  };
  const limits = policy.limits;
  const baseForExtra = priorBaseline.get('pad_out_stand_available');
  assert(baseForExtra);
  const rows = controls.flatMap((control,index) => {
    const priorRow = priorBaseline.get(control.id);
    const template = priorRow ?? baseForExtra;
    const request = structuredClone(template.request);
    assert.equal(request.max_tokens,limits.response_tokens);
    assert.equal(request.model,manifest.model_alias);
    const marker = 'Input JSON:\n';
    const at = request.messages[0].content.indexOf(marker);
    assert(at >= 0);
    const envelope = JSON.parse(request.messages[0].content.slice(at+marker.length));
    assert.equal(envelope.target_slots.length,1);
    const slot = envelope.target_slots[0];
    assert.deepEqual(slot.approved_terms,[]);
    assert.deepEqual(slot.protected_facts,[]);
    if (priorRow) {
      assert.equal(slot.source_original,control.source);
      assert.equal(digest(JSON.stringify(request)),priorRow.request_sha256);
    } else {
      slot.source_original = control.source;
      slot.source_for_translation = control.source;
      if (control.cue_id) {
        slot.segment_id = control.cue_id;
        envelope.source_context = [];
      }
      request.messages[0].content = request.messages[0].content.slice(0,at+marker.length)
        + JSON.stringify(envelope);
    }
    assert.equal(slot.source_original,slot.source_for_translation);
    const selected = occurrenceRequest(request,policy);
    const forbidden = control.expected_meaning ?? control.expected_fact ?? null;
    if (forbidden) {
      assert(!JSON.stringify(request).includes(forbidden));
      assert(!JSON.stringify(selected.request).includes(forbidden));
    }
    return Array.from({length:limits.paired_runs_per_arm},(_,runIndex) => {
      const run = runIndex+1;
      const order = (index+runIndex)%2===0 ? ['baseline','occurrence']
        : ['occurrence','baseline'];
      return order.map(variant => {
        const candidateRequest = variant==='occurrence'
          ? selected.request : structuredClone(request);
        return {case_id:control.id,control_id:control.id,role:control.role,run,
          cue_id:slot.segment_id,line_index:slot.line_index,
          variant,decisions:selected.decisions,review_state:selected.review_state,
          baseline_identical:selected.baseline_identical,
          original_reg061_baseline_sha256:priorRow?.request_sha256 ?? null,
          request:candidateRequest,
          request_sha256:digest(JSON.stringify(candidateRequest)),
          resume_identity:resumeIdentity(candidateRequest,identities)};
      });
    }).flat();
  });
  assert.equal(rows.length,limits.maximum_chats);
  assert.equal(rows.length*2,limits.maximum_preflights);
  const planned = [{spec:{id:'7b',modelPath,manifestPath,modelSha:modelHash,
    manifestSha:manifestHash,alias:manifest.model_alias},rows}];
  const frozen = {schema_version:1,experiment:'reg-062-occurrence-terms-v1',
    expected,limits,sourceHashes,identities,
    cases:controls.map(row=>({id:row.id,source:row.source,role:row.role,
      source_facts:row.source_facts ?? [row.expected_meaning ?? row.expected_fact]})),
    planned};
  const frozenBytes = `${JSON.stringify(frozen,null,2)}\n`;
  const publicFreeze = {schema_version:1,experiment:frozen.experiment,
    expected,limits,sourceHashes,identities,
    private_requests_sha256:digest(frozenBytes),
    cases:frozen.cases,rows:rows.map(({request,...row})=>row)};
  const publicBytes = `${JSON.stringify(publicFreeze,null,2)}\n`;
  return {root,parent,frozenPath,publicFreezePath,frozen,frozenBytes,publicBytes,
    expected,limits,sourceHashes,identities,planned,runtimePath,assetRoot};
}

export async function writeOrCheckFreeze(state,mode) {
  assert(['--freeze','--preflight','--probe'].includes(mode));
  if (mode==='--freeze') {
    await fs.mkdir(state.parent,{recursive:true});
    await fs.writeFile(state.frozenPath,state.frozenBytes,{flag:'wx'});
    await fs.writeFile(state.publicFreezePath,state.publicBytes,{flag:'wx'});
  } else {
    assert.equal(await fs.readFile(state.frozenPath,'utf8'),state.frozenBytes,
      'Frozen request or identity changed');
    assert.equal(await fs.readFile(state.publicFreezePath,'utf8'),state.publicBytes);
  }
}
