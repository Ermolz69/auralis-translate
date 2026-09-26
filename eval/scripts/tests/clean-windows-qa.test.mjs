import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  prepareCleanWindowsQa,
  renderSetupProbe,
} from "../clean-windows-qa.mjs";

const hash = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const revision = "a".repeat(40);

async function fixture(t) {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "auralis-clean-qa-test-"),
  );
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const installer = path.join(root, "target/release/bundle/msi/Auralis.msi");
  await fs.mkdir(path.dirname(installer), { recursive: true });
  const installerBytes = Buffer.from("fixture installer: not an actual MSI");
  const applicationBytes = Buffer.from("fixture application");
  await fs.writeFile(installer, installerBytes);
  await fs.writeFile(
    path.join(root, "target/release/auralis-app.exe"),
    applicationBytes,
  );
  const audit = {
    target: "x86_64-pc-windows-msvc",
    artifact: {
      file: "target/release/bundle/msi/Auralis.msi",
      bytes: installerBytes.length,
      sha256: hash(installerBytes),
    },
    application: {
      packageType: "msi",
      bytes: applicationBytes.length,
      sha256: hash(applicationBytes),
      sourceSha256: hash(applicationBytes),
    },
    payload: { files: ["auralis-app.exe"] },
  };
  await fs.writeFile(
    path.join(root, "target/bundle-verification.json"),
    JSON.stringify(audit),
  );
  return {
    root,
    installer,
    audit,
    options: {
      auralisRoot: root,
      output: path.join(root, "kit"),
      auralisRevision: revision,
      translateRevision: revision,
    },
  };
}

test("copies only independent diagnostics and audited installer; reports no executed verdict", async (t) => {
  const { options } = await fixture(t);
  const manifest = await prepareCleanWindowsQa(options);
  const names = (await fs.readdir(options.output)).sort();
  assert.deepEqual(
    names,
    [
      "Auralis.msi",
      "CHECKLIST.md",
      "REPORT.json",
      "bundle-verification.json",
      "draft-reference.json",
      "manifest.json",
      "setup-probe.srt",
      "setup-probe.vtt",
    ].sort(),
  );
  for (const entry of manifest.files) {
    const bytes = await fs.readFile(path.join(options.output, entry.file));
    assert.equal(hash(bytes), entry.sha256);
    assert.equal(bytes.length, entry.bytes);
  }
  const report = JSON.parse(
    await fs.readFile(path.join(options.output, "REPORT.json"), "utf8"),
  );
  assert.equal(report.verdict, "not_executed");
  assert.equal(report.installer_signature, "not_verified");
  assert.ok(report.steps.every((step) => step.status === "not_run"));
  const source = await fs.readFile(
    path.join(options.output, "setup-probe.srt"),
    "utf8",
  );
  assert.ok(source.startsWith("\uFEFF1\r\n"));
  assert.ok(source.includes("列车将在 08:10 出发。"));
  assert.ok(!source.includes("Поезд"));
  await assert.rejects(prepareCleanWindowsQa(options), /EEXIST/u);
});

test("rejects modified installer or stale application before creating output", async (t) => {
  const { root, installer, options } = await fixture(t);
  const original = await fs.readFile(installer);
  await fs.appendFile(installer, "changed");
  await assert.rejects(prepareCleanWindowsQa(options), /Installer differs/u);
  await assert.rejects(fs.stat(options.output), /ENOENT/u);
  await fs.writeFile(installer, original);
  await fs.appendFile(
    path.join(root, "target/release/auralis-app.exe"),
    "changed",
  );
  await assert.rejects(prepareCleanWindowsQa(options), /application differs/u);
});

test("rejects audit path escape, missing application audit and abbreviated revisions", async (t) => {
  const { root, audit, options } = await fixture(t);
  await assert.rejects(
    prepareCleanWindowsQa({
      ...options,
      output: path.join(root, "target/release/qa"),
    }),
    /outside application/u,
  );
  await assert.rejects(
    prepareCleanWindowsQa({ ...options, auralisRevision: "abc" }),
    /full source/u,
  );
  audit.artifact.file = "../../elsewhere.msi";
  const auditPath = path.join(root, "target/bundle-verification.json");
  await fs.writeFile(auditPath, JSON.stringify(audit));
  await assert.rejects(prepareCleanWindowsQa(options), /inside the build/u);
  delete audit.application;
  await fs.writeFile(auditPath, JSON.stringify(audit));
  await assert.rejects(
    prepareCleanWindowsQa(options),
    /completed Windows MSI/u,
  );
});

test("probe rejects multiline, styled or invalid timed cues", () => {
  const probe = {
    schema_version: 1,
    reference_status: "unreviewed_draft",
    cues: [
      {
        id: 1,
        start_ms: 1000,
        end_ms: 5000,
        source: "你好。",
        draft: "Привет.",
      },
    ],
  };
  assert.ok(
    renderSetupProbe(probe, "vtt")
      .toString("utf8")
      .startsWith("\uFEFFWEBVTT\r\n\r\n"),
  );
  for (const patch of [
    { source: "a\nb" },
    { source: "<i>a</i>" },
    { end_ms: 0 },
  ]) {
    assert.throws(
      () =>
        renderSetupProbe(
          { ...probe, cues: [{ ...probe.cues[0], ...patch }] },
          "srt",
        ),
      /Invalid plain/u,
    );
  }
});
