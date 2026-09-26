import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderSetupProbe } from "./clean-windows-qa.mjs";
import { digest } from "./flores-file-fixture.mjs";
import { readRunSnapshot } from "./cli-run-state.mjs";
import {
  startProcess,
  stopProcess,
  freeLoopbackPort,
  waitForHealthyServer,
} from "./local-process.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const TIMEOUT_MS = 300_000;

async function runFormat({
  workspace,
  format,
  probe,
  executable,
  profilePath,
  profileBytes,
  serverPath,
  modelPath,
  gpuLayers,
}) {
  const directory = path.join(workspace, format);
  await fs.mkdir(directory);
  const calls = [];
  let server;
  async function cli(args, expectedCode) {
    const child = startProcess(executable, args, root);
    calls.push({ args, child });
    let timer;
    try {
      const ended = await Promise.race([
        child.ended,
        new Promise((_, reject) => {
          timer = setTimeout(
            () => reject(new Error("Machine CLI timeout")),
            TIMEOUT_MS,
          );
        }),
      ]);
      assert.equal(
        ended.code,
        expectedCode,
        `${JSON.stringify(args)}: ${ended.error?.message ?? ended.signal ?? child.stderr}`,
      );
      assert(
        !child.stdoutTruncated && !child.stderrTruncated,
        "Protocol capture was truncated",
      );
      return child.stdout;
    } finally {
      clearTimeout(timer);
    }
  }
  try {
    const sourcePath = path.join(directory, `source.${format}`);
    const outputPath = path.join(directory, `result.ru.${format}`);
    const source = renderSetupProbe(probe, format);
    await fs.writeFile(sourcePath, source, { flag: "wx" });
    const inspect = format === "srt" ? "inspect" : "inspect-vtt";
    const original = JSON.parse(await cli(["--json", inspect, sourcePath], 0))
      .report.report;
    const profile = JSON.parse(profileBytes);
    const port = await freeLoopbackPort();
    const url = `http://127.0.0.1:${port}/`;
    const serverArgs = [
      "--host",
      "127.0.0.1",
      "--port",
      String(port),
      "--model",
      modelPath,
      "--alias",
      profile.model_alias,
      "--ctx-size",
      String(profile.min_context_tokens),
      "--n-gpu-layers",
      String(gpuLayers),
      "--cache-ram",
      "0",
      "--parallel",
      "1",
      "--jinja",
    ];
    server = startProcess(serverPath, serverArgs, root);
    await waitForHealthyServer(url, server, TIMEOUT_MS);
    const requestPath = path.join(directory, "request.json");
    const state = path.join(directory, "state");
    await fs.writeFile(
      requestPath,
      `${JSON.stringify(
        {
          schema_version: 1,
          request: {
            command: format === "srt" ? "translate" : "translate-vtt",
            source: sourcePath,
            state_dir: state,
            profile: profilePath,
            endpoint: url,
            output: outputPath,
          },
        },
        null,
        2,
      )}\n`,
      { flag: "wx" },
    );
    const started = performance.now();
    const stdout = await cli(["--jsonl", "--request", requestPath], 3);
    const durationMs = performance.now() - started;
    const events = stdout.trim().split("\n").map(JSON.parse);
    events.forEach((event, index) => {
      assert.equal(event.schema_version, 1);
      assert.equal(event.sequence, index + 1);
    });
    assert.equal(events[0].event, "run_started");
    assert(
      events.some(
        (event) =>
          event.event === "model_ready" &&
          event.build === profile.runtime_build_info,
      ),
    );
    assert(
      events.some(
        (event) =>
          event.event === "progress" &&
          event.saved_blocks === 1 &&
          event.total_blocks === 1,
      ),
    );
    assert.equal(events.at(-1).event, "completed");
    assert.equal(events.at(-1).exit_code, 3);
    assert.equal(
      events.filter((event) => ["completed", "failed"].includes(event.event))
        .length,
      1,
    );
    const result = events.find((event) => event.event === "result");
    assert(result);
    assert.equal(result.review_state, "needs_review");
    const bytes = await fs.readFile(outputPath);
    assert.equal(result.output_sha256, digest(bytes));
    assert.equal(result.output_bytes, bytes.length);
    const translated = JSON.parse(await cli(["--json", inspect, outputPath], 0))
      .report.report;
    assert.equal(translated.segments.length, original.segments.length);
    assert.equal(
      translated.protected_ranges.length,
      original.protected_ranges.length,
    );
    for (let index = 0; index < original.protected_ranges.length; index++) {
      const before = original.protected_ranges[index],
        after = translated.protected_ranges[index];
      assert.deepEqual(
        source.subarray(before.start, before.end),
        bytes.subarray(after.start, after.end),
      );
    }
    const comparisons = original.segments.map((segment, index) => {
      const candidate = translated.segments[index];
      for (const field of ["id", "cue_id", "start_ms", "end_ms"])
        assert.deepEqual(candidate[field], segment[field]);
      assert.equal(candidate.text_slots.length, segment.text_slots.length);
      const text = candidate.text_slots.map((slot) => slot.text).join("\n");
      return {
        cue_id: segment.id,
        source: segment.text_slots.map((slot) => slot.text).join("\n"),
        draft: probe.cues[index].draft,
        candidate: text,
        exact_draft_match: text === probe.cues[index].draft,
        diagnostic: probe.cues[index].diagnostic,
        reviewer: null,
      };
    });
    const status = JSON.parse(
      await cli(["--json", "status", state, result.run_id], 0),
    );
    assert.equal(status.report.report.state, "validated");
    assert.equal(status.report.report.selected_result_id, result.result_id);
    const snapshot = readRunSnapshot(
      path.join(state, "auralis-translate.sqlite"),
      result.run_id,
    );
    assert.equal(snapshot.run.state, "validated");
    assert.equal(snapshot.run.profile_fingerprint, digest(profileBytes));
    assert.equal(snapshot.source.source_sha256, digest(source));
    assert.equal(snapshot.checkpoints.length, 1);
    assert.equal(snapshot.results.length, 1);
    assert.deepEqual(await fs.readFile(snapshot.source.source_locator), source);
    await stopProcess(server);
    const reexportPath = path.join(directory, `offline.ru.${format}`);
    const reexport = JSON.parse(
      await cli(
        [
          "--json",
          "resume",
          state,
          result.run_id,
          profilePath,
          url,
          reexportPath,
        ],
        3,
      ),
    );
    assert.equal(reexport.result.result_id, result.result_id);
    assert.equal(reexport.result.output_sha256, result.output_sha256);
    assert.equal(reexport.model, null);
    assert.deepEqual(await fs.readFile(reexportPath), bytes);
    assert.deepEqual(await fs.readFile(sourcePath), source);
    const report = {
      schema_version: 1,
      format,
      created_at: new Date().toISOString(),
      origin: "project-authored setup diagnostics",
      run_id: result.run_id,
      result_id: result.result_id,
      review_state: result.review_state,
      source_sha256: digest(source),
      output_sha256: digest(bytes),
      cli_sha256: digest(await fs.readFile(executable)),
      profile_sha256: digest(profileBytes),
      model_sha256: profile.model_file_sha256,
      runtime_build: profile.runtime_build_info,
      server_args: serverArgs,
      cli_duration_ms: durationMs,
      protocol_events: events,
      source_inspection: original,
      result_inspection: translated,
      status: status.report.report,
      offline_reexport: "identical",
      reference_status: "unreviewed_draft",
      language_verdict: "not_reviewed",
      bilingual_reviewed: false,
      comparisons,
    };
    await fs.writeFile(
      path.join(directory, "report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
      { flag: "wx" },
    );
    console.log(
      `${format}: checked-model JSON request/JSONL progress, review exit 3 and offline JSON re-export passed`,
    );
  } catch (error) {
    await fs.writeFile(
      path.join(directory, "failure.json"),
      JSON.stringify({ error: error.stack ?? String(error) }, null, 2),
    );
    throw error;
  } finally {
    for (const call of calls) await stopProcess(call.child);
    await stopProcess(server);
    await fs.writeFile(
      path.join(directory, "cli.log"),
      calls
        .map(
          (call) =>
            `${JSON.stringify(call.args)}\n${call.child.stdout}\n${call.child.stderr}`,
        )
        .join("\n"),
    );
    if (server)
      await fs.writeFile(
        path.join(directory, "server.log"),
        `${server.stdout}\n${server.stderr}`,
      );
  }
}

async function main() {
  assert.equal(process.platform, "win32");
  const serverPath = process.env.AURALIS_TEST_LLAMA_SERVER,
    modelPath = process.env.AURALIS_TEST_GGUF;
  for (const asset of [serverPath, modelPath])
    assert(
      asset && path.isAbsolute(asset),
      "Supply absolute installed model/runtime paths",
    );
  const gpuLayers = Number(process.env.AURALIS_TEST_GPU_LAYERS ?? "0");
  assert(Number.isInteger(gpuLayers) && gpuLayers >= 0 && gpuLayers <= 999);
  const executable = path.join(
    root,
    "target/release/auralis-translation-cli.exe",
  );
  const profilePath = path.join(
    root,
    "models/manifests/hy_mt2_1_8b_q4_k_m.checked.experimental.json",
  );
  for (const asset of [executable, profilePath, serverPath, modelPath])
    assert((await fs.stat(asset)).isFile());
  const parent = path.join(root, ".cache/eval/machine-protocol-runs");
  await fs.mkdir(parent, { recursive: true });
  const workspace = await fs.mkdtemp(path.join(parent, "protocol-"));
  console.log(`Local machine-protocol workspace: ${workspace}`);
  const probe = JSON.parse(
    await fs.readFile(
      path.join(root, "eval/fixtures/clean-windows/setup-probe.v1.json"),
      "utf8",
    ),
  );
  const profileBytes = await fs.readFile(profilePath);
  for (const format of ["srt", "vtt"])
    await runFormat({
      workspace,
      format,
      probe,
      executable,
      profilePath,
      profileBytes,
      serverPath,
      modelPath,
      gpuLayers,
    });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
