import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { freeLoopbackPort, startProcess, stopProcess, waitForHealthyServer } from './local-process.mjs';
import { runtimeSampler } from './runtime-sampler.mjs';
import { checkBudget, decodeCandidate } from './target-term-scope.mjs';
import { buildReg062, writeOrCheckFreeze, digest, hashFile } from './build-reg-062-occurrences-v1.mjs';

const mode = process.argv[2] ?? '--probe';
assert(process.argv.length <= 3 && ['--freeze','--preflight','--probe'].includes(mode));
const state = await buildReg062();
await writeOrCheckFreeze(state,mode);
const {root,parent,frozenBytes,expected,limits,sourceHashes,identities,
  planned,runtimePath,assetRoot} = state;
if (mode !== '--probe') {
  console.log(JSON.stringify({status:'verified',experiment:state.frozen.experiment,
    private_requests_sha256:digest(frozenBytes),identities,limits,sourceHashes,
    identical_pairs:planned[0].rows.filter(row => row.variant === 'occurrence'
      && row.baseline_identical).length}));
  process.exit(0);
}
assert.equal(execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}),'',
  'Model calls require a clean committed candidate');
const attempts = (await fs.readdir(parent).catch(error => error.code === 'ENOENT' ? [] :
  Promise.reject(error))).filter(name => name.startsWith('attempt-'));
assert.equal(attempts.length, 0, 'Frozen experiment permits one model attempt');
await fs.mkdir(parent, { recursive: true });
const workspace = await fs.mkdtemp(path.join(parent, 'attempt-'));
const started = performance.now();
const report = { schema_version: 1, experiment: 'reg-062-occurrence-terms-v1',
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
      const env = { ...process.env, PATH: `${path.dirname(runtimePath)};${path.join(assetRoot,
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
        const entry = { case_id: item.case_id, cue_id: item.cue_id, run:item.run,
          control_id: item.control_id, role: item.role, variant: item.variant,
          decisions:item.decisions, review_state:item.review_state, baseline_identical:item.baseline_identical,
          resume_identity:item.resume_identity, checkpoint_accepted:false,
          original_reg061_baseline_sha256: item.original_reg061_baseline_sha256,
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
          arm.requests.push({ case_id: entry.case_id, cue_id: entry.cue_id, run:entry.run,
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
          console.log(`${spec.id} ${item.control_id} run ${item.run} ${item.variant}: ${entry.structural_outcome ?? 'aborted'}`);
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
  console.log(`REG-062 occurrence terms screen ${report.status}: ${reportPath}`);
}
