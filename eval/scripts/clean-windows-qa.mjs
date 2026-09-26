import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const HASH = /^[a-f0-9]{64}$/u;
const REVISION = /^[a-f0-9]{40}$/u;

async function identity(file) {
  const stat = await fs.lstat(file);
  if (!stat.isFile()) throw new Error(`Expected a regular file: ${file}`);
  return {
    bytes: stat.size,
    sha256: crypto
      .createHash("sha256")
      .update(await fs.readFile(file))
      .digest("hex"),
  };
}

function timestamp(milliseconds, separator) {
  const seconds = Math.floor(milliseconds / 1000);
  return `00:${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}${separator}${String(milliseconds % 1000).padStart(3, "0")}`;
}

export function renderSetupProbe(probe, format) {
  if (
    probe.schema_version !== 1 ||
    probe.reference_status !== "unreviewed_draft" ||
    !probe.cues?.length
  ) {
    throw new Error("Expected versioned, unreviewed setup diagnostics");
  }
  if (!["srt", "vtt"].includes(format))
    throw new Error("Unsupported setup probe format");
  const separator = format === "srt" ? "," : ".";
  const blocks = probe.cues.map((cue, index) => {
    if (
      cue.id !== index + 1 ||
      !Number.isInteger(cue.start_ms) ||
      !Number.isInteger(cue.end_ms) ||
      cue.start_ms < 0 ||
      cue.end_ms <= cue.start_ms ||
      cue.end_ms >= 3_600_000 ||
      typeof cue.source !== "string" ||
      !cue.source.trim() ||
      /[\r\n<>]/u.test(cue.source) ||
      typeof cue.draft !== "string" ||
      !cue.draft.trim()
    )
      throw new Error("Invalid plain setup cue");
    return `${cue.id}\r\n${timestamp(cue.start_ms, separator)} --> ${timestamp(cue.end_ms, separator)}\r\n${cue.source}\r\n`;
  });
  return Buffer.from(
    `\uFEFF${format === "vtt" ? "WEBVTT\r\n\r\n" : ""}${blocks.join("\r\n")}`,
    "utf8",
  );
}

export async function prepareCleanWindowsQa({
  auralisRoot,
  output,
  auralisRevision,
  translateRevision,
}) {
  if (!REVISION.test(auralisRevision) || !REVISION.test(translateRevision))
    throw new Error("Require full source revisions");
  for (const directory of [
    path.join(auralisRoot, "target"),
    path.join(auralisRoot, "src-tauri"),
    path.join(auralisRoot, "apps/desktop/dist"),
    path.join(root, "target"),
  ]) {
    const relative = path.relative(
      path.resolve(directory),
      path.resolve(output),
    );
    if (!relative.startsWith("..") && !path.isAbsolute(relative))
      throw new Error(
        "QA output must stay outside application build/resource directories",
      );
  }
  const auditPath = path.join(auralisRoot, "target/bundle-verification.json");
  const auditBytes = await fs.readFile(auditPath);
  const audit = JSON.parse(auditBytes);
  if (
    audit.target !== "x86_64-pc-windows-msvc" ||
    audit.application?.packageType !== "msi" ||
    !HASH.test(audit.artifact?.sha256 ?? "") ||
    !HASH.test(audit.application?.sha256 ?? "") ||
    !HASH.test(audit.application?.sourceSha256 ?? "") ||
    !Array.isArray(audit.payload?.files)
  ) {
    throw new Error(
      "Require a completed Windows MSI payload/application audit",
    );
  }
  const installer = path.resolve(
    auralisRoot,
    audit.artifact.file.replaceAll("\\", "/"),
  );
  const relative = path.relative(
    path.resolve(auralisRoot, "target/release/bundle"),
    installer,
  );
  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    path.extname(installer).toLowerCase() !== ".msi"
  ) {
    throw new Error(
      "Audited installer must be inside the build bundle directory",
    );
  }
  const actual = await identity(installer);
  if (
    actual.sha256 !== audit.artifact.sha256 ||
    actual.bytes !== audit.artifact.bytes
  )
    throw new Error("Installer differs from audited bytes");
  const application = await identity(
    path.join(auralisRoot, "target/release/auralis-app.exe"),
  );
  if (
    application.sha256 !== audit.application.sourceSha256 ||
    application.bytes !== audit.application.bytes
  ) {
    throw new Error("Current application differs from audited source identity");
  }
  const probePath = path.join(
    root,
    "eval/fixtures/clean-windows/setup-probe.v1.json",
  );
  const probeBytes = await fs.readFile(probePath);
  const probe = JSON.parse(probeBytes);
  const content = new Map([
    ["setup-probe.srt", renderSetupProbe(probe, "srt")],
    ["setup-probe.vtt", renderSetupProbe(probe, "vtt")],
    ["draft-reference.json", probeBytes],
    [
      "CHECKLIST.md",
      Buffer.from(
        "# Independent QA handoff\n\nUse `manifest.json` to identify the installer and untouched input files. Fill in `REPORT.json` only from observed results and keep failed cases. This kit contains no model weights; download/install must be an explicit application action. The Russian drafts are unreviewed diagnostics.\n\n" +
          (
            await fs.readFile(
              path.join(
                root,
                "docs/evaluation/006-clean-windows-installation.md",
              ),
              "utf8",
            )
          ).replace(/\[([^\]]+)\]\(([^)]+)\)/gu, (match, label, destination) =>
            /^[a-z][a-z\d+.-]*:/iu.test(destination) ? match : label,
          ),
      ),
    ],
    ["bundle-verification.json", auditBytes],
    [
      "REPORT.json",
      Buffer.from(
        `${JSON.stringify(
          {
            schema_version: 1,
            verdict: "not_executed",
            environment: null,
            installer_signature: "not_verified",
            network_disconnected_evidence: null,
            steps: [
              "cold_launch_without_model",
              "source_import",
              "explicit_download_install_select",
              "interrupted_setup",
              "offline_cold_translation",
              "comparison_and_export",
              "pause_restart_resume_and_edit",
              "strict_rejection",
              "repair_and_removal",
            ].map((name) => ({
              name,
              status: "not_run",
              observations: [],
              evidence: [],
            })),
            language_review: {
              status: "not_reviewed",
              comparisons: probe.cues.map((cue) => ({
                cue_id: cue.id,
                diagnostic: cue.diagnostic,
                candidate: null,
                meaning_notes: null,
                grammar_notes: null,
                reviewer: null,
              })),
            },
            failures: [],
          },
          null,
          2,
        )}\n`,
      ),
    ],
  ]);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.mkdir(output);
  const files = [];
  const name = path.basename(installer);
  await fs.copyFile(
    installer,
    path.join(output, name),
    fs.constants.COPYFILE_EXCL,
  );
  const copied = await identity(path.join(output, name));
  if (copied.sha256 !== actual.sha256 || copied.bytes !== actual.bytes)
    throw new Error("Copied installer identity mismatch");
  files.push({ file: name, ...copied });
  for (const [file, bytes] of content) {
    await fs.writeFile(path.join(output, file), bytes, { flag: "wx" });
    files.push({ file, ...(await identity(path.join(output, file))) });
  }
  const manifest = {
    schema_version: 1,
    created_at: new Date().toISOString(),
    purpose:
      "Separate clean Windows QA inputs; never application or release payloads.",
    verdict: "not_executed",
    auralis_revision: auralisRevision,
    translate_revision: translateRevision,
    installer_signature: "not_verified",
    reference_status: "unreviewed_draft",
    files,
  };
  await fs.writeFile(
    path.join(output, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    { flag: "wx" },
  );
  return manifest;
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  const [auralisRoot, output, auralisRevision, translateRevision] =
    process.argv.slice(2);
  if (!auralisRoot || !output)
    throw new Error(
      "Usage: clean-windows-qa.mjs AURALIS_ROOT OUTPUT AURALIS_REVISION TRANSLATE_REVISION",
    );
  const manifest = await prepareCleanWindowsQa({
    auralisRoot: path.resolve(auralisRoot),
    output: path.resolve(output),
    auralisRevision,
    translateRevision,
  });
  console.log(
    `Prepared ${manifest.files.length + 1} independent QA files at ${path.resolve(output)}; clean installation and language review remain unexecuted.`,
  );
}
