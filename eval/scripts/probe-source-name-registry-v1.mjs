import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { freeLoopbackPort, startProcess, stopProcess, waitForExit, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const parent = path.join(root, '.cache/eval/source-name-registry-v1/freeze-02');
const freezePath = path.join(parent, 'freeze.json');
const mode = process.argv[2] ?? 'probe';
assert(process.argv.length <= 3 && ['probe','--freeze','--preflight'].includes(mode));
const fixturePath = path.join(root, 'eval/corpora/source-name-registry-development-v1.json');
const manifestPath = path.join(root, 'models/manifests/hy_mt2_1_8b_q4_k_m.context_v8_target_first_batch1.experimental.json');
const cliPath = path.join(root, '.cache/build/name-registry/debug/auralis-translation-cli.exe');
const modelPath = path.join(root, '.cache/models/Hy-MT2-1.8B-Q4_K_M.gguf');
const runtimePath = path.join(root, '.cache/runtime/llama/llama-server.exe');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function hashFile(file) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}
const fixture = JSON.parse(await fs.readFile(fixturePath));
const baselineBytes = await fs.readFile(manifestPath);
const baseline = JSON.parse(baselineBytes);
const policySource = (await fs.readFile(path.join(root, 'crates/auralis-translation-llamacpp/src/name_registry_prompt.rs'),'utf8')).replaceAll('\r\n','\n');
const policyHash = digest(policySource + baseline.prompt_template_sha256);
const registryProfile = {...baseline, name_registry_policy_sha256:policyHash,
  max_name_proposals_entries:8, max_name_proposals_bytes:4096};
const source = Buffer.from(fixture.cues.map(cue => `${cue.id}\n00:00:${String(cue.id).padStart(2,'0')},000 --> 00:00:${String(cue.id+1).padStart(2,'0')},000\n${cue.source}\n`).join('\n'));
const scene = Buffer.from(`${JSON.stringify({schema_version:1, source_sha256:digest(source),
  evidence_id:'authored-source-name-registry-development-v1',scene_end_ids:fixture.scene_end_ids},null,2)}\n`);
const proposals = Buffer.from(`${JSON.stringify({schema_version:1,source_sha256:digest(source),
  extraction_policy_id:'chinese-explicit-address-v1',expected_revision:1,proposals:fixture.proposals},null,2)}\n`);
const registryBytes = Buffer.from(`${JSON.stringify(registryProfile,null,2)}\n`);
const budget = {chat_requests:84,preflight_requests:168,combined_tokens:150528,
  context_tokens:2048,output_tokens:256,safety_tokens:64,wall_ms:1800000,
  arm_ms:360000,readiness_ms:180000,repetitions:3,retries:0};
assert.equal(baseline.model_file_sha256,'dc5f44fcf1fa496ee7ad725982c0c8c553a4de00259b53af84c4b89fb0c06699');
assert.equal(baseline.prompt_version,8);
assert.equal(baseline.target_segments_per_block,1);
assert.equal(fixture.cues.length,14);
assert.equal(fixture.split,'development');
async function codeFiles(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory,{withFileTypes:true})) {
    if (entry.isDirectory()) files.push(...await codeFiles(path.join(directory,entry.name)));
    else if (/\.(rs|sql)$/.test(entry.name) || entry.name === 'Cargo.toml') files.push(path.join(directory,entry.name));
  }
  return files;
}
const paths = [...await codeFiles(path.join(root,'crates')), path.join(root,'Cargo.lock'),
  fileURLToPath(import.meta.url),path.join(root,'eval/experiments/2026-10-03-source-name-registry-v1-plan.md')];
const codeHashes = await Promise.all(paths.sort().map(async file => ({path:path.relative(root,file).replaceAll('\\','/'),sha256:await hashFile(file)})));
const identities = {fixture_sha256:await hashFile(fixturePath),source_sha256:digest(source),
  scene_sha256:digest(scene),proposals_sha256:digest(proposals),baseline_profile_sha256:digest(baselineBytes),
  registry_profile_sha256:digest(registryBytes),registry_policy_sha256:policyHash,
  cli_sha256:await hashFile(cliPath),model_sha256:await hashFile(modelPath),runtime_sha256:await hashFile(runtimePath),code_hashes:codeHashes};
assert.equal(identities.model_sha256,baseline.model_file_sha256);
assert.equal(identities.runtime_sha256,'6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4');
const files = {'source.zh.srt':source,'scene-map.json':scene,'proposals.json':proposals,
  'baseline-profile.json':baselineBytes,'registry-profile.json':registryBytes};
if (mode === '--freeze') {
  await fs.mkdir(parent,{recursive:true});
  for (const [name,bytes] of Object.entries(files)) await fs.writeFile(path.join(parent,name),bytes,{flag:'wx'});
  await fs.writeFile(freezePath,`${JSON.stringify({schema_version:1,experiment:'source-name-registry-v1',
    frozen_at:new Date().toISOString(),identities,budget,seed:null,seed_reason:'CLI does not expose RNG seed',
    order:['baseline','registry','registry','baseline','baseline','registry']},null,2)}\n`,{flag:'wx'});
  console.log(`Frozen source-name-registry-v1: ${freezePath}`);
  process.exit(0);
}
const frozen = JSON.parse(await fs.readFile(freezePath));
assert.deepEqual(identities,frozen.identities,'Code/data/model changed after freeze');
assert.deepEqual(budget,frozen.budget);
for (const [name,bytes] of Object.entries(files)) assert.equal(digest(await fs.readFile(path.join(parent,name))),digest(bytes));
if (mode === '--preflight') {
  console.log(JSON.stringify({status:'verified_frozen',identities:{...identities,code_hashes:`${codeHashes.length} files`},budget}));
  process.exit(0);
}
const attemptGuard = path.join(parent,'attempt-started.json');
const active = execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
  '@(Get-Process llama-server -ErrorAction SilentlyContinue).Count'],{encoding:'utf8',windowsHide:true}).trim();
assert.equal(active,'0','Another llama-server is active; do not overlap GPU work');
const workspace = await fs.mkdtemp(path.join(parent,'attempt-'));
await fs.writeFile(attemptGuard,`${JSON.stringify({workspace,started_at:new Date().toISOString(),freeze_sha256:await hashFile(freezePath)})}\n`,{flag:'wx'});
const started = performance.now();
const report = {schema_version:1,experiment:'source-name-registry-v1',status:'running',started_at:new Date().toISOString(),
  freeze_sha256:await hashFile(freezePath),identities,budget,code_commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),
  dirty_state:execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'}).trim(),
  platform:{os:`${os.type()} ${os.release()} ${os.arch()}`,cpu:os.cpus()[0].model,ram_bytes:os.totalmem()},
  arms:[],errors:[],resources:null};
const save = () => fs.writeFile(path.join(workspace,'report.json'),`${JSON.stringify(report,null,2)}\n`);
const remaining = () => {const ms = budget.wall_ms-(performance.now()-started);assert(ms>0,'Wall budget exhausted');return ms;};
let server,sampler,cli;
try {
  await save();
  const port = await freeLoopbackPort();
  const url = `http://127.0.0.1:${port}/`;
  const serverArgs = ['--model',modelPath,'--alias',baseline.model_alias,'--host','127.0.0.1','--port',String(port),
    '-c','2048','-ngl','99','--parallel','1','--jinja','--cache-ram','0'];
  report.server_args = serverArgs.map(value => value === modelPath ? '<pinned-model>' : value);
  server = startProcess(runtimePath,serverArgs,root,{...process.env,
    PATH:`${path.dirname(runtimePath)};${path.join(root,'.cache/runtime/cudart')};${process.env.PATH}`},{maxCaptureCharacters:4*1024*1024});
  await waitForHealthyServer(url,server,Math.min(budget.readiness_ms,remaining()));
  sampler = runtimeSampler(path.join(workspace,'resources.jsonl'),root,
    () => [server,cli].filter(p => p && p.child.exitCode === null && p.child.signalCode === null).map(p => p.child.pid));
  for (const [index,variant] of frozen.order.entries()) {
    const arm = {index,variant,repetition:Math.floor(index/2)+1,started_at:new Date().toISOString(),status:'running'};
    report.arms.push(arm);
    const dir = path.join(workspace,`arm-${index}-${variant}`);
    await fs.mkdir(dir);
    const state = path.join(dir,'state');
    const output = path.join(dir,'candidate.ru.srt');
    const command = variant === 'baseline' ? 'translate-v5-scene' : 'translate-v8-names';
    const args = [command,path.join(parent,'source.zh.srt'),state,path.join(parent,`${variant}-profile.json`),path.join(parent,'scene-map.json')];
    if (variant === 'registry') args.push(path.join(parent,'proposals.json'));
    args.push(url,output);
    const armStarted = performance.now();
    cli = startProcess(cliPath,args,root,process.env,{maxCaptureCharacters:4*1024*1024});
    try {await waitForExit(cli,Math.min(budget.arm_ms,remaining()));arm.status='completed';}
    catch(error) {arm.status='failed';arm.error=error.message;}
    finally {await stopProcess(cli);}
    arm.elapsed_ms = performance.now()-armStarted;
    arm.stdout=cli.stdout;arm.stderr=cli.stderr;arm.exit_code=cli.child.exitCode;
    arm.source_after_sha256=await hashFile(path.join(parent,'source.zh.srt'));
    arm.output_text=await fs.readFile(output,'utf8').catch(()=>null);
    arm.output_sha256=await hashFile(output).catch(()=>null);
    const dbPath = path.join(state,'auralis-translate.sqlite');
    if (await fs.stat(dbPath).catch(()=>null)) {
      const db = new DatabaseSync(dbPath,{readOnly:true});
      try {
        arm.run=db.prepare('SELECT * FROM runs LIMIT 1').get()??null;
        arm.checkpoints=db.prepare('SELECT * FROM block_checkpoints ORDER BY block_index').all();
        arm.results=db.prepare('SELECT * FROM results').all();
        arm.registries=db.prepare('SELECT * FROM name_registry_revisions ORDER BY revision').all();
        arm.bindings=db.prepare('SELECT * FROM run_name_registries').all();
        arm.requests=db.prepare('SELECT * FROM inference_requests ORDER BY sequence').all().map(row=>({...row,
          rendered_request:Buffer.from(row.rendered_request).toString('utf8'),
          raw_response:row.raw_response===null?null:Buffer.from(row.raw_response).toString('utf8')}));
      } finally {db.close();}
    }
    arm.chats=arm.requests?.filter(r=>r.request_kind==='chat_completion').length??0;
    arm.preflights=arm.requests?.filter(r=>r.request_kind!=='chat_completion').length??0;
    assert.equal(arm.source_after_sha256,identities.source_sha256);
    assert(arm.chats<=14 && arm.preflights<=28,'Per-arm request budget exceeded');
    await fs.writeFile(path.join(dir,'arm.json'),`${JSON.stringify(arm,null,2)}\n`,{flag:'wx'});
    await save();
    console.log(`name registry arm=${index} ${variant} ${arm.status}: chats=${arm.chats}, checkpoints=${arm.checkpoints?.length??0}`);
    if (arm.status!=='completed') break;
  }
  const chats=report.arms.flatMap(a=>a.requests??[]).filter(r=>r.request_kind==='chat_completion');
  assert(chats.length<=budget.chat_requests);
  assert(chats.reduce((sum,r)=>sum+(r.prompt_tokens??0)+(r.completion_tokens??0),0)<=budget.combined_tokens);
  report.status=report.arms.length===6 && report.arms.every(a=>a.status==='completed')?'complete_needs_review':'stopped_with_failure';
  if (report.status!=='complete_needs_review') process.exitCode=1;
} catch(error) {report.status='failed';report.errors.push(String(error));process.exitCode=1;}
finally {
  await stopProcess(cli);
  report.resources=sampler?await sampler.stop():null;
  await stopProcess(server);
  if (server) {await fs.writeFile(path.join(workspace,'server.stdout.log'),server.stdout);await fs.writeFile(path.join(workspace,'server.stderr.log'),server.stderr);}
  report.finished_at=new Date().toISOString();report.wall_elapsed_ms=performance.now()-started;
  await save();console.log(`name registry ${report.status}: ${workspace}`);
}
