# Clean Windows installation and offline translation protocol

Status: unexecuted release protocol, 26 September 2026. This defines the remaining S6/S8 packaging evidence. A local MSI content audit and a development-machine native test do not close G9.

## Environment and evidence

Use a disposable clean Windows x64 VM or a separate test machine/account with no existing Auralis installation, application data, model cache, Rust or Node.js. Keep its baseline snapshot. Record OS edition/build, updates, CPU, RAM, disk space, GPU/driver, network configuration and WebView2 availability. Select and name the intended supported OS/backend profile before interpreting results. The current pinned model package is experimental Windows x64 CPU; GPU and other OS claims require independent evidence.

Copy only the audited installer and a small test subtitle into the target machine. Record installer SHA-256 and signing status. Keep model weights, local development caches and test reports out of the installer. The test source and draft Russian comparison are separately supplied QA inputs. Node/Rust may run on an external controller to analyze collected files; they must not become application prerequisites.

The local unsigned MSI can exercise development installation where explicitly accepted for the test environment. Official delivery still requires the configured signing/release workflow. Record the exact executable/package digests and the current Translate and Auralis source revisions.

## Sequence

1. **Install and cold launch.** Install the application in the test environment. Record setup outcome, WebView2 acquisition if required, notices, installed files/bytes and cold launch time. Launch without a model. Verify the project UI starts, no model download happens automatically, and unavailable-model diagnostics are understandable.
2. **Import before inference.** Create a test project and import a separately supplied strict SRT. Preserve its external SHA-256. Confirm the source artifact becomes ready and the original can be inspected. Prepare a translation; without a selected package, starting must fail without publishing a result or damaging the source.
3. **Explicit model setup.** With network available, click **Download and install**. Record the requested pinned release/backend, transfer outcome and cache/package disk growth. Click selection only after installation verifies the assets. Check that weights came from the declared upstream origin rather than the application installer or our GitHub release.
4. **Interrupted setup.** On the disposable environment, stop the application during an incomplete download and reopen it. Retry through the UI. Preserve a record of the partial download and resumed/restarted transfer. An incomplete or damaged package must remain unselectable. Complete installation, then verify the selected package survives a further application restart.
5. **Offline translation.** Disconnect the test VM/machine from the network after complete setup and keep it disconnected. Launch again, import a fresh strict SRT and translate with the selected package. Record cold start, wall time, sampled CPU/RAM and saved-block progress. The ready result must be a separate file, linked to the same project and marked **Needs review** until language review is complete.
6. **Compare and export.** Inspect every test source/candidate line in the project workspace against the separately supplied draft reference. Record grammar, meaning, numbers, negation and marker differences; draft equality is not a language-quality verdict. Export the separate result and compare timing, cue identity/order, line count and protected bytes. Verify the external and managed originals are unchanged. Open the output in the declared subtitle consumer and record its version and behavior.
7. **Recovery and revision.** Start a longer file, request pause and record the pending/acknowledged state. Restart the application and resume the linked run. In a separate disposable test, force termination after an observed committed block, restart and resume. Preserve saved checkpoints and publish no partial result. Edit a ready line, wait for the new artifact and confirm the previous result/original remain available. Name the exact tested boundary; this does not establish all races or power-loss durability.
8. **Strict rejection.** Import unsupported styling or malformed timing. Confirm rejection happens before model startup and before run state is created. Retain the failed input and user-visible diagnostic separately from accepted runs.
9. **Repair and removal.** In the disposable environment, test the documented pinned-package repair workflow while idle and its rejection during an active run. Record cleanup and selected-package reconstruction after restart. Exercise application uninstall separately; record what happens to application data and model packages. Reset the VM snapshot for another clean run rather than deleting unrelated user files. Package upgrade/coexistence/removal policies remain implementation work.

## Minimal independently supplied probe

The versioned [authored setup fixture](../../eval/fixtures/clean-windows/setup-probe.v1.json)
contains the four diagnostics below. After Auralis completes a production MSI
build and payload audit, prepare a separate handoff directory from the Translate
checkout:

```text
task eval:clean-windows:prepare AURALIS_ROOT=ABSOLUTE_AURALIS_CHECKOUT OUTPUT_DIR=NEW_IGNORED_QA_DIRECTORY AURALIS_REVISION=FULL_BUILD_COMMIT TRANSLATE_REVISION=FULL_PINNED_TRANSLATE_COMMIT
```

Use absolute paths and full 40-character commits for the installer build; these
are supplied provenance, not a reproducible-build attestation. The generator
rejects an MSI that differs from the audit or a stale application source hash,
copies the installer and audit, generates BOM/CRLF SRT/WebVTT diagnostics, and
includes an unreviewed Russian draft, detached checklist and empty report. Every
copied input has a length and SHA-256 in `manifest.json`. A new output directory is
required and application build/resource directories are rejected. No model,
runtime, Node/Rust runner, application data or private corpus is copied.

Copy this independent directory to the disposable Windows environment. It is
QA material, never an application resource or release publication directory.
The target machine needs only the installer and application UI to execute the
checklist; controller-side `task eval:clean-windows:check` verifies preparation
behavior using fake installer bytes. Leave all report steps `not_run` until
observed, record signature status explicitly, and retain baseline inputs while
editing `REPORT.json`. Preparation alone does not close clean-install or language
gates. A failed preparation may retain an incomplete directory without a final
manifest; use a new destination after resolving the failure.

Create a UTF-8 plain SRT outside the installation directory, with one cue for each authored source below. Freeze timings and a source hash before import. Use these as small setup diagnostics; representative Chinese/Japanese subtitle corpora and bilingual review remain separate language gates.

| Chinese source           | Unreviewed Russian draft                   | Diagnostic      |
| ------------------------ | ------------------------------------------ | --------------- |
| 列车将在 08:10 出发。    | Поезд отправится в 08:10.                  | Time and number |
| 不要打开这扇门。         | Не открывайте эту дверь.                   | Negation        |
| 我们还需要 3 个箱子。    | Нам нужны ещё 3 коробки.                   | Quantity        |
| 请在星期五之前完成检查。 | Пожалуйста, завершите проверку до пятницы. | Deadline        |

Supply WebVTT separately if that format is included in the declared profile. The [long-file protocol](005-long-file-recovery.md) can generate larger authored files on the controller; artificial timing/repeated text remains technical load evidence.

## Report and gate decision

Retain a report with environment identity, source/installer/model/runtime/profile hashes, signatures, steps and observed failures, screenshots/logs, source/draft/candidate files, run/result identities, exported files and resource/disk measurements. After the application exits, collect database copies for controller-side integrity/recovery analysis without editing the originals.

| Claim                                | Required direct evidence                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Installer excludes weights/test data | Materialized file inventory, application identity and payload policy passed for this exact installer.             |
| Explicit setup works                 | Real unseeded UI download/install/select and interrupted retry on the clean environment.                          |
| Offline operation works              | Network-disconnected cold launch and real translation from the installed package after restart.                   |
| Durable project workflow works       | Preserved original/checkpoints and ready result/revision through the named interruption tests.                    |
| G9 passes                            | All applicable clean-environment setup and offline checks passed on the declared profile, with retained evidence. |
| Language support passes              | Separate source-aware corpus review and the G3/G4/G5 thresholds in the product plan.                              |

Keep every failed case in the report. A process remaining alive for a few seconds, a seeded developer cache, compiler success, synthetic reference equality or installer extraction alone cannot establish clean installation or language quality.
