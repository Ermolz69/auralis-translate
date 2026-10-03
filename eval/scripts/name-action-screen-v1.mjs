import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { startProcess, stopProcess, waitForExit } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const base = path.join(root, '.cache/eval/name-action-admission-v1');
const mode = process.argv[2];
assert(['--prepare','--freeze','--preflight','--probe','--check'].includes(mode));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = file => fs.readFile(path.join(root,file));
async function hashFile(file) {
  const digest = createHash('sha256');
  for await (const bytes of createReadStream(path.join(root,file))) digest.update(bytes);
  return digest.digest('hex');
}
const profilePath = 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_names_review_only.experimental.json';
const policyPath = 'crates/auralis-translation-llamacpp/src/name_proposal_admission.rs';
const policy = hash((await read(policyPath)).toString('utf8').replaceAll('\r\n','\n'));
const historicProfile = JSON.parse(await read('models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_source_names_batch1.experimental.json'));
const profile = {...historicProfile, name_proposal_admission_sha256:policy};
if (mode === '--prepare') {
  await fs.writeFile(path.join(root,profilePath),`${JSON.stringify(profile,null,2)}\n`,{flag:'wx'});
  console.log(`Prepared one admission-only profile: ${profilePath}`); process.exit(0);
}
assert.deepEqual(JSON.parse(await read(profilePath)),profile);
async function filesIn(dir) {
  const result = [];
  for (const entry of await fs.readdir(path.join(root,dir),{withFileTypes:true})) {
    const file = `${dir}/${entry.name}`;
    if (entry.isDirectory()) result.push(...await filesIn(file));
    else result.push(file);
  }
  return result;
}
const budget = {attempts:1,new_chat_calls:0,new_preflight_calls:0,new_tokens:0,new_development_cues:20,
  historic_paired_repetitions:3,semantic_retries:0,holdout_cues:0,replay_wall_ms:120000,
  sampled_working_set_bytes:2147483648,sample_interval_ms:5000};
const publicFile = 'eval/reports/2026-10-03-name-action-admission-v1.json';
if (mode === '--check') {
  const report = JSON.parse(await read(publicFile));
  const frozenBytes = await fs.readFile(path.join(base,'freeze.json'));
  assert.equal(report.freeze_sha256,hash(frozenBytes));
  assert.equal(report.status,'contained_no_quality_advancement');
  assert.deepEqual(report.budget,budget);
  assert.equal(report.new_chat_calls,0); assert.equal(report.new_tokens,0);
  assert.equal(report.replay.frozen_replays.length,84); assert.equal(report.replay.controls.length,20);
  assert.equal(report.replay.admission_policy_sha256,policy);
  assert.equal(report.human_review_count,0);
  assert.equal(report.decision,'reject_quality_advancement_keep_v8');
  const parentBytes = await read('eval/reports/2026-10-03-source-name-registry-v1.json');
  assert.equal(report.parent_report_sha256,hash(parentBytes));
  const parent = JSON.parse(parentBytes);
  for (const [i,row] of report.replay.frozen_replays.entries()) {
    assert.deepEqual(row.original,parent.observations[i]);
    const named = row.original.hints.length > 0;
    assert.equal(row.replay_outcome,named?'name_proposal_review_required':'unchanged_structural_path');
    assert.equal(row.new_accepted_checkpoint,null);
  }
  for (const repetition of [1,2,3]) for (const id of [5,8,9]) {
    const pick = variant => parent.observations.find(o=>o.variant===variant&&o.repetition===repetition&&o.segment_id===id);
    assert.equal(pick('baseline').rendered_request,pick('registry').rendered_request);
  }
  for (const row of report.replay.controls) {
    if (row.case.name === null) assert.equal(row.baseline_prompt,row.candidate_prompt);
    assert.equal(row.raw_response,null); assert.equal(row.accepted_checkpoint,null);
  }
  const review = JSON.parse(await read('eval/reports/2026-10-03-name-action-admission-v1-ai-review.json'));
  assert.equal(review.report_sha256,hash(await read(publicFile)));
  assert.equal(review.human_review_count,0); assert.equal(review.new_language_observations,0);
  assert.equal(review.decision,report.decision);
  console.log('NAME-02 replay verified: 33/33 proposal responses blocked, 9/9 old no-name pairs unchanged, 20 deterministic controls; no inference or quality advancement.');
  process.exit(0);
}
const deps = '.cache/build/name-registry/debug/deps';
const executables = (await fs.readdir(path.join(root,deps))).filter(name=>/^name_action_admission-.*\.exe$/.test(name));
const testBinary = executables.map(name=>`${deps}/${name}`).find(file=>execFileSync(path.join(root,file),['--list'],{encoding:'utf8',windowsHide:true}).includes('offline_screen: test'));
assert(testBinary,'Build task test:name-action before freezing');
const trackedFiles = [...(await filesIn('crates')).filter(file=>/\.(rs|sql)$/.test(file)||file.endsWith('/Cargo.toml')),
  ...await filesIn('.cache/runtime/llama'), ...await filesIn('.cache/runtime/cudart'),
  '.cache/models/Hy-MT2-1.8B-Q4_K_M.gguf','.cache/build/name-registry/debug/auralis-translation-cli.exe',testBinary,
  'Cargo.lock','Taskfile.yml',profilePath,'eval/corpora/name-action-admission-development-v1.json',
  'eval/reports/2026-10-03-name-action-trace-v1.json','eval/reports/2026-10-03-source-name-registry-v1.json',
  'eval/experiments/2026-10-03-name-action-admission-v1-plan.md','docs/reference/name-proposal-admission-v1.md',
  'eval/scripts/name-action-screen-v1.mjs','eval/scripts/trace-name-action-v1.mjs','eval/scripts/check-regression-catalog-v43.mjs'];
const identities = await Promise.all(trackedFiles.sort().map(async file=>({path:file,sha256:await hashFile(file)})));
assert.equal(identities.find(i=>i.path.endsWith('.gguf')).sha256,historicProfile.model_file_sha256);
assert.equal(identities.find(i=>i.path==='.cache/runtime/llama/llama-server.exe').sha256,'6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
const frozenPath = path.join(base,'freeze.json');
if (mode === '--freeze') {
  await fs.mkdir(base,{recursive:true});
  const platform = {os:`${os.type()} ${os.release()} ${os.arch()}`,cpu:os.cpus()[0].model,logical_cpus:os.cpus().length,
    ram_bytes:os.totalmem(),gpu:execFileSync('nvidia-smi',['--query-gpu=name,driver_version,memory.total,memory.used','--format=csv,noheader,nounits'],{encoding:'utf8',windowsHide:true}).trim(),
    cim_reason:'Initial Win32_Processor/ComputerSystem/OperatingSystem CIM reads denied; Node OS and NVIDIA reads used.'};
  await fs.writeFile(frozenPath,`${JSON.stringify({schema_version:1,experiment:'name-action-admission-v1',frozen_at:new Date().toISOString(),
    code_commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
    dirty_state:execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'}).trim(),
    identities,budget,platform,test_binary:testBinary,model_profile:profile,
    factor:'Admission only; unchanged requests and raw responses',arms:['historic_structural_acceptance','fail_closed_review_required'],
    seed:null,seed_reason:'Offline replay; no new model calls, historical RNG unknown.'},null,2)}\n`,{flag:'wx'});
  console.log(`Frozen ${identities.length} code/data/asset identities; new inference budget zero.`); process.exit(0);
}
const frozenBytes = await fs.readFile(frozenPath);
const frozen = JSON.parse(frozenBytes);
assert.deepEqual(frozen.identities,identities,'Frozen bytes changed'); assert.deepEqual(frozen.budget,budget);
if (mode === '--preflight') {console.log('NAME-02 offline freeze verified; zero-inference policy.');process.exit(0);}
assert.equal(mode,'--probe');
await fs.writeFile(path.join(base,'attempt-started.json'),`${JSON.stringify({started_at:new Date().toISOString(),freeze_sha256:hash(frozenBytes)})}\n`,{flag:'wx'});
const rawPath = path.join(base,'replay.json');
const report = {schema_version:1,experiment:'name-action-admission-v1',started_at:new Date().toISOString(),
  status:'running',freeze_sha256:hash(frozenBytes),budget,identities,platform:frozen.platform,
  code_commit:frozen.code_commit,dirty_state:frozen.dirty_state,new_chat_calls:0,new_tokens:0,human_review_count:0,
  parent_report_sha256:await hashFile('eval/reports/2026-10-03-source-name-registry-v1.json'),errors:[],replay:null,resources:null};
const started = performance.now();
let child,sampler;
try {
  child = startProcess(path.join(root,testBinary),['offline_screen','--exact','--nocapture'],root,{...process.env,NAME_ACTION_REPLAY_REPORT:rawPath});
  sampler = runtimeSampler(path.join(base,'resources.jsonl'),root,()=>child.child.exitCode===null?[child.child.pid]:[]);
  await waitForExit(child,budget.replay_wall_ms);
  report.replay = JSON.parse(await fs.readFile(rawPath));
  assert.equal(report.replay.new_chat_calls,0);
  report.status='contained_no_quality_advancement';
} catch(error) {report.status='failed';report.errors.push(String(error));process.exitCode=1;}
finally {
  report.resources=sampler?await sampler.stop():null;
  await stopProcess(child);
  report.stdout=child?.stdout??null; report.stderr=child?.stderr??null; report.exit_code=child?.child.exitCode??null;
  report.finished_at=new Date().toISOString();report.replay_wall_elapsed_ms=performance.now()-started;
  const workingSets=report.resources?.samples.flatMap(s=>s.processes??[]).map(p=>p.WorkingSet64).filter(Number.isFinite)??[];
  report.sampled_process_peak_bytes=workingSets.length?Math.max(...workingSets):null;
  report.peak_reason=workingSets.length?'Approximate sampled lower bound.':'Short replay exited before a usable process sample; peak unknown.';
  if ((report.sampled_process_peak_bytes??0)>budget.sampled_working_set_bytes || report.replay_wall_elapsed_ms>budget.replay_wall_ms) {
    report.status='failed';report.errors.push('Replay resource budget exceeded');process.exitCode=1;
  }
  report.decision='reject_quality_advancement_keep_v8';
  report.named_language_acceptance_denominator=0;
  await fs.writeFile(path.join(base,'report.json'),`${JSON.stringify(report,null,2)}\n`,{flag:'wx'});
  await fs.writeFile(path.join(root,publicFile),`${JSON.stringify(report,null,2)}\n`,{flag:'wx'});
  console.log(`NAME-02 ${report.status}; new chats=0; report retained.`);
}
