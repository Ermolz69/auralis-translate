import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { freeLoopbackPort, startProcess, stopProcess, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';
import { checkBudget, decodeCandidate, resumeIdentity, scopedRequest } from './target-term-scope.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv[2] ?? '--probe';
assert(process.argv.length <= 3 && ['--freeze', '--preflight', '--probe'].includes(mode));
assert.equal(process.platform, 'win32');
const packPath = path.join(root, 'eval/regressions/v8-natural-7b-semantic-risk-v1.json');
const controlsPath = path.join(root,
  'eval/regressions/reg-058-provisional-terms-controls-v1.json');
const priorPath = path.join(root,
  '.cache/eval/v8-asus-single-target-v1/attempt-dVT3zA/report.json');
const regressionPath = path.join(root, 'eval/regressions/reg-061-term-hint-contamination-v1.json');
const policyPath = path.join(root, 'eval/profiles/reg-061-target-terms-v1.json');
const policy = JSON.parse(await fs.readFile(policyPath));
const parent = path.join(root, '.cache/eval/reg-061-target-terms-v1');
const frozenPath = path.join(parent, 'frozen-requests.json');
const publicFreezePath = path.join(root, 'eval/experiments/2026-10-03-reg-061-target-terms-v1-freeze.json');
const runtimePath = process.env.AURALIS_TEST_LLAMA_SERVER;
const specs = [
  { id: '7b', modelPath: process.env.AURALIS_TEST_GGUF_LARGE,
    manifestPath: path.join(root,
      'models/manifests/hy_mt2_7b_q4_k_m.context_v8_target_first_batch1.experimental.json'),
    modelSha: '9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b',
    manifestSha: 'a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc' },
];
const expected = { pack: 'fcba9d337e8bdf3dd0d431cf886917bcefa999a44d9eb30fcc5450a6147ebe09',
  controls: 'b4cd39caae1bbac13847d9a5ee2cb8e21993882d0342cc710a9cb44957a9d344',
  prior: '9ae192177dd51611f49adf7699ca4fe9677a230dc74cbdedded2618040cc193c',
  runtime: '6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4' };
const limits = policy.limits;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const hashFile = async file => {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
assert(runtimePath && path.isAbsolute(runtimePath));
assert(specs.every(spec => spec.modelPath && path.isAbsolute(spec.modelPath)));
assert.equal(await hashFile(packPath), expected.pack);
assert.equal(await hashFile(controlsPath), expected.controls);
assert.equal(await hashFile(priorPath), expected.prior);
assert.equal(await hashFile(runtimePath), expected.runtime);
const pack = JSON.parse(await fs.readFile(packPath));
const corpus = JSON.parse(await fs.readFile(controlsPath));
assert.equal(corpus.split, 'authored_development_not_holdout');
assert.equal(corpus.controls.length, 10);
assert.equal(await hashFile(regressionPath), '24a4acafd6e7035fbc2fa58da39ead78aad069588b4a58344af5fd19e70e0499');
const prior = JSON.parse(await fs.readFile(priorPath));
assert.equal(prior.experiment, 'v8-asus-single-target-v1');
assert.equal(prior.arms[1].status, 'completed');
const regression = JSON.parse(await fs.readFile(regressionPath));
const controls = [...corpus.controls, ...[...regression.related_controls, ...regression.negative_controls].map(row => ({...row, role:'new_REG061', parent_id:row.source.includes('鼠标') ? 'mouse_pad_not_stand' : 'multicore_not_multiprocessor'}))];
assert.equal(controls.length,15);
expected.regression = await hashFile(regressionPath);
expected.policy = await hashFile(policyPath);
assert.equal(new Set(controls.map(row => row.id)).size, controls.length);
for (const row of controls) {
  assert(pack.minimal_reproducers.some(parent => parent.id === row.parent_id));
  if (row.role.startsWith('known_') && row.id !== 'multicore_extra' &&
      row.id !== 'mouse_pad_extra') {
    const original = [...pack.related_controls, ...pack.negative_controls]
      .find(candidate => candidate.id === row.id);
    assert(original);
    assert.equal(original.source, row.source);
    assert.equal(original.expected_meaning, row.expected_meaning);
  }
}
const originals = new Map(pack.minimal_reproducers.map(row => {
  const entry = prior.arms[1].requests.find(item => item.request_kind === 'chat_completion'
    && item.segment_id === row.cue_id);
  assert(entry);
  assert.equal(digest(Buffer.from(entry.rendered_request)), entry.request_sha256);
  return [row.id, entry];
}));
for (const spec of specs) {
  assert.equal(await hashFile(spec.modelPath), spec.modelSha);
  assert.equal(await hashFile(spec.manifestPath), spec.manifestSha);
  const manifest = JSON.parse(await fs.readFile(spec.manifestPath, 'utf8'));
  assert.equal(manifest.model_file_sha256, spec.modelSha);
  assert.equal(manifest.target_segments_per_block, 1);
  spec.alias = manifest.model_alias;
}
const planned = specs.map(spec => ({ spec, rows: controls.flatMap((control, index) => {
    const caseRow = pack.minimal_reproducers.find(row => row.id === control.parent_id);
    const original = originals.get(control.parent_id);
    const request = JSON.parse(original.rendered_request);
    assert.equal(request.max_tokens, limits.response_tokens);
    request.model = spec.alias;
    const [head, input] = request.messages[0].content.split('Input JSON:\n');
    assert(input && head);
    const envelope = JSON.parse(input);
    assert.equal(envelope.target_slots.length, 1);
    assert.equal(envelope.target_slots[0].segment_id, caseRow.cue_id);
    assert.deepEqual(envelope.target_slots[0].approved_terms, []);
    assert.deepEqual(envelope.target_slots[0].protected_facts, []);
    envelope.target_slots[0].source_original = control.source;
    envelope.target_slots[0].source_for_translation = control.source;
    assert.equal(envelope.target_slots[0].source_original, envelope.target_slots[0].source_for_translation);
    request.messages[0].content = `${head}Input JSON:\n${JSON.stringify(envelope)}`;
    assert(!JSON.stringify(request).includes(control.expected_meaning));
    const sequence = index % 2 === 0 ? ['baseline', 'scoped']
      : ['scoped', 'baseline'];
    return sequence.map(variant => {
      const scoped = scopedRequest(request,policy);
      const candidateRequest = variant === 'scoped' ? scoped.request : structuredClone(request);
      assert(!JSON.stringify(candidateRequest).includes(control.expected_meaning));
      return { case_id: caseRow.id, cue_id: caseRow.cue_id,
        control_id: control.id, role: control.role, variant,
        decisions:scoped.decisions, review_state:scoped.review_state,
        baseline_identical:scoped.baseline_identical,
        original_request_sha256: original.request_sha256,
        request: candidateRequest,
        request_sha256: digest(Buffer.from(JSON.stringify(candidateRequest))) };
    });
}) }));
assert(planned.every(arm => arm.rows.length === limits.chats_per_arm));
const priorTerms = JSON.parse(await fs.readFile(path.join(root,'eval/reports/2026-10-02-reg-058-provisional-terms-v1.json')));
for (const row of planned[0].rows.filter(row => row.variant === 'baseline').slice(0,10)) {
  assert.equal(row.request_sha256, priorTerms.rows.find(prior => prior.id === row.control_id && prior.variant === 'baseline').request_sha256);
}
const sourceFiles = ['eval/profiles/reg-061-target-terms-v1.json',
  'eval/scripts/target-term-scope.mjs','eval/scripts/probe-reg-061-target-terms-v1.mjs',
  'eval/scripts/local-process.mjs','eval/scripts/runtime-sampler.mjs',
  'eval/experiments/2026-10-03-reg-061-target-terms-v1-plan.md'];
const sourceHashes = Object.fromEntries(await Promise.all(sourceFiles.map(async file =>
  [file,await hashFile(path.join(root,file))])));
const identities = {source_sha256:'923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b',
  model_sha256:specs[0].modelSha, runtime_sha256:expected.runtime,
  manifest_sha256:specs[0].manifestSha,policy_sha256:expected.policy,
  implementation_sha256:sourceHashes['eval/scripts/target-term-scope.mjs']};
for (const arm of planned) for (const row of arm.rows) {
  row.resume_identity = resumeIdentity(row.request,identities);
}
const frozen = {schema_version:1,experiment:'reg-061-target-terms-v1',
  expected,limits,sourceHashes,identities,planned};
const frozenBytes = `${JSON.stringify(frozen,null,2)}\n`;
const publicFreeze = {schema_version:1,experiment:frozen.experiment,expected,limits,sourceHashes,
  identities,private_requests_sha256:digest(frozenBytes),
  rows:planned[0].rows.map(({request,...row}) => row)};
const publicBytes = `${JSON.stringify(publicFreeze,null,2)}\n`;
if (mode === '--freeze') {
  await fs.mkdir(parent,{recursive:true});
  await fs.writeFile(frozenPath,frozenBytes,{flag:'wx'});
  await fs.writeFile(publicFreezePath,publicBytes,{flag:'wx'});
} else {
  assert.equal(await fs.readFile(frozenPath,'utf8'),frozenBytes,'Frozen request or identity changed');
  assert.equal(await fs.readFile(publicFreezePath,'utf8'),publicBytes);
}
if (mode !== '--probe') {
  console.log(JSON.stringify({status:'verified',experiment:frozen.experiment,
    private_requests_sha256:digest(frozenBytes),identities,limits,sourceHashes,
    identical_pairs:planned[0].rows.filter(row => row.variant === 'scoped' && row.baseline_identical).length}));
  process.exit(0);
}

const attempts = (await fs.readdir(parent).catch(error => error.code === 'ENOENT' ? [] :
  Promise.reject(error))).filter(name => name.startsWith('attempt-'));
assert.equal(attempts.length, 0, 'Frozen experiment permits one model attempt');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const started = performance.now();
const report = { schema_version: 1, experiment: 'reg-061-target-terms-v1',
  status: 'running', started_at: new Date().toISOString(),
  expected, limits, identities, sourceHashes,
  private_requests_sha256:digest(frozenBytes), checkpoints:0, published_results:0,
  timezone_offset:'+03:00', observer_overhead_ms:null,
  harness_sha256: await hashFile(fileURLToPath(import.meta.url)),
  platform: { os: `${os.type()} ${os.release()} ${os.arch()}`,
    cpu: os.cpus()[0].model, ram_bytes: os.totalmem() },
  code_commit: null, arms: [], errors: [] };
const reportPath = path.join(workspace, 'report.json');
const save = () => fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
const remaining = () => {
  const ms = limits.wall_ms - (performance.now() - started);
  assert(ms > 0, 'Frozen wall budget exhausted');
  return ms;
};
const post = async (url, endpoint, body, timeoutMs) => {
  const began = performance.now();
  const response = await fetch(`${url}${endpoint}`, { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    signal: AbortSignal.timeout(Math.min(timeoutMs, remaining())) });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { request_sha256: digest(Buffer.from(JSON.stringify(body))),
    raw_response: bytes.toString('utf8'), raw_response_sha256: digest(bytes),
    http_status: response.status, elapsed_ms: Math.round(performance.now() - began) };
};
try {
  report.code_commit = execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  report.dirty_state = execFileSync('git',['status','--short'],{cwd:root,encoding:'utf8'});
  await save();
  for (const { spec, rows } of planned) {
    const arm = { id: spec.id, model_sha256: spec.modelSha,
      manifest_sha256: spec.manifestSha, status: 'preparing', requests: [], errors: [] };
    report.arms.push(arm);
    const directory = path.join(workspace, spec.id);
    await fs.mkdir(directory);
    const journal = await fs.open(path.join(directory, 'requests.jsonl'), 'wx');
    let server, sampler;
    try {
      const port = await freeLoopbackPort();
      const url = `http://127.0.0.1:${port}/`;
      const args = ['--model', spec.modelPath, '--alias', spec.alias,
        '--host', '127.0.0.1', '--port', String(port), '-c', '2048', '-ngl', '99',
        '--parallel', '1', '--jinja', '--cache-ram', '0'];
      const env = { ...process.env, PATH: `${path.dirname(runtimePath)};${path.join(root,
        '.cache/runtime/cudart')};${process.env.PATH}` };
      server = startProcess(runtimePath, args, root, env,
        { maxCaptureCharacters: 4 * 1024 * 1024 });
      await waitForHealthyServer(url, server,
        Math.min(limits.readiness_ms, remaining()));
      sampler = runtimeSampler(path.join(directory, 'resources.jsonl'), root,
        () => [server.child.pid]);
      arm.status = 'running';
      await save();
      for (const item of rows) {
        const entry = { case_id: item.case_id, cue_id: item.cue_id,
          control_id: item.control_id, role: item.role, variant: item.variant,
          decisions:item.decisions, review_state:item.review_state, baseline_identical:item.baseline_identical,
          resume_identity:item.resume_identity, checkpoint_accepted:false,
          original_request_sha256: item.original_request_sha256,
          request: item.request, request_sha256: item.request_sha256,
          preflight: [], started_at: new Date().toISOString() };
        try {
          const template = await post(url, 'apply-template', {
            model: item.request.model, messages: item.request.messages,
            response_format: item.request.response_format }, limits.per_preflight_ms);
          entry.preflight.push(template);
          assert.equal(template.http_status, 200);
          const rendered = JSON.parse(template.raw_response).prompt;
          const tokenized = await post(url, 'tokenize',
            { content: rendered, add_special: false, parse_special: true },
            limits.per_preflight_ms);
          entry.preflight.push(tokenized);
          assert.equal(tokenized.http_status, 200);
          const tokens = JSON.parse(tokenized.raw_response).tokens;
          assert(Array.isArray(tokens) && tokens.every(Number.isInteger));
          checkBudget(tokens.length,limits);
          entry.prompt_tokens_preflight = tokens.length;
          const chat = await post(url, 'v1/chat/completions', item.request,
            limits.per_chat_ms);
          entry.chat = chat;
          const parsed = JSON.parse(chat.raw_response);
          entry.finish_reason = parsed.choices?.[0]?.finish_reason ?? null;
          entry.usage = parsed.usage ?? null;
          assert.equal(entry.usage?.prompt_tokens, tokens.length);
          if (chat.http_status === 200 && entry.finish_reason === 'stop') {
            try {
              entry.candidate = decodeCandidate(chat, {segment_id:item.cue_id,line_index:0});
              entry.structural_outcome = 'accepted_structure_unreviewed_meaning';
            } catch (error) { entry.structural_outcome = `invalid: ${error.message}`; }
          } else entry.structural_outcome = 'incomplete_or_http_failure';
          if (chat.http_status !== 200) throw new Error(`Chat HTTP ${chat.http_status}`);
        } catch (error) {
          entry.error = String(error);
          throw error;
        } finally {
          await journal.write(`${JSON.stringify(entry)}\n`);
          await journal.sync();
          arm.requests.push({ case_id: entry.case_id, cue_id: entry.cue_id,
            control_id: entry.control_id, role: entry.role, variant: entry.variant,
            request_sha256: entry.request_sha256,
            raw_response_sha256: entry.chat?.raw_response_sha256 ?? null,
            prompt_tokens: entry.usage?.prompt_tokens ?? null,
            completion_tokens: entry.usage?.completion_tokens ?? null,
            chat_elapsed_ms: entry.chat?.elapsed_ms ?? null,
            finish_reason: entry.finish_reason ?? null,
            structural_outcome: entry.structural_outcome ?? 'aborted',
            candidate: entry.candidate ?? null });
          await save();
          console.log(`${spec.id} ${item.control_id} ${item.variant}: ${entry.structural_outcome ?? 'aborted'}`);
        }
      }
      arm.status = 'complete_responses_unreviewed';
    } catch (error) {
      arm.status = 'failed';
      arm.errors.push(String(error));
    } finally {
      arm.resources = sampler ? await sampler.stop() : null;
      await stopProcess(server);
      if (server) {
        await fs.writeFile(path.join(directory, 'server.stdout.log'), server.stdout);
        await fs.writeFile(path.join(directory, 'server.stderr.log'), server.stderr);
      }
      await journal.close();
      arm.finished_at = new Date().toISOString();
      await save();
    }
    if (arm.status === 'failed') break;
  }
  report.status = report.arms.length === 1 && report.arms.every(arm =>
    arm.status === 'complete_responses_unreviewed') ? 'complete_responses_unreviewed'
    : 'completed_with_failure';
  if (report.status !== 'complete_responses_unreviewed') process.exitCode = 1;
} catch (error) {
  report.status = 'failed';
  report.errors.push(String(error));
  process.exitCode = 1;
} finally {
  report.finished_at = new Date().toISOString();
  report.wall_elapsed_ms = Math.round(performance.now() - started);
  await save();
  console.log(`REG-061 target terms screen ${report.status}: ${reportPath}`);
}
