# HOST-01: native historical staged-publication interruption

Date: 29 September 2026. Auralis local candidate:
`feat/real-tts-pilot` at `1b531251b272ee284968836287019a3a9679f87d`.
This is one bounded process-kill and recovery result, not full HOST-01, G7 or
release acceptance. The retained fixture and detailed SQLite inspection report
remain private in the local Auralis worktree. Its report SHA-256 is
`A34D65EC66F48109FAE2AE3A9ACCFE1FE8FC372B041B1F4D667140B8FDAA6480`.

## Frozen run and retained failure

The authored two-cue Chinese SRT used the local Hy-MT2 1.8B Q4_K_M GGUF
`DC5F44FCF1FA496EE7AD725982C0C8C553A4DE00259B53AF84C4B89FB0C06699`
and llama-server executable
`6F15BE27BD80B6B4D52AFEFA49094E18FCFAB55D5DA354D717971F2D2537B2F4`.
The checked profile used a 2,048-token context, 99 requested GPU layers and
one target segment per block on an RTX 3070 with 8,192 MiB VRAM. Runtime
library hashes and model-exclusive peak memory were not captured. The two
accepted Russian lines were `Здравствуйте.` and `До свидания.`. This is a
synthetic recovery fixture, not a natural subtitle or human language review.

One initial invocation built and translated both cues, then the observer failed
with `Historical staged marker differs from the core result`. The native test
hook had also held the first latest-base manual edit. The failed fixture was
cleaned, so its exact unexpected marker is unavailable. The hook was restricted
to an edit whose base result differs from the observed head, and a negative
control was added before releasing the later branch. Exactly one documented
repair invocation on the same source/model/runtime then passed. Neither failure
is counted as a product recovery pass.

## Process boundary and observations

The real model committed one validated attempt and two contiguous checkpoints.
The desktop UI created a later edit, explicitly selected the original model
result, and started an older-base historical branch. A native-only hook held
after the pending publication, managed artifact and outbox committed, before
the save response. The external observer confirmed the pending outbox had zero
attempts, the staging file matched the verified Translate result, and no final
file existed. It killed the desktop, checked that both SQLite journals,
existing files and the explicit choice were unchanged, then restarted it.
Production startup finalized exactly the staged file. No additional model
attempt occurred; the reopened UI still selected revision 1 and previewed the
new branch without attaching it.

| Retained observation | Value |
| --- | --- |
| Translation / run | `7014761e-3137-45e0-af4a-2bfb82018ce9` / `cde02bfa-29b6-4d3d-971a-12f5e51e76e8` |
| Source SHA-256 | `e19dd2556c91b7a20f5bdcfe3777404a19501a884ed3e048bbce3d50944e0ead` |
| Explicitly selected revision 1 | `d1052df3-1ab7-4939-88e4-a0783d02dff4`; link revision `4` |
| Recovered branch revision 3 | `3d6ce493-3821-4cc0-86a7-bf93f32efd24` |
| Branch artifact / outbox | `2a63e393-4d9c-4d4d-92fd-5228140caec2` / `aef6fcc9-5cb4-434c-b526-fbacaf76bf64` |
| Staged/final bytes and SHA-256 | `165`; `94a450a310da9191d7bd8b234469332b5345cf978eaca5eaa2c9f819688b2f20` |

An independent read-only inspector reopened both retained databases and
managed storage after the native run. It rehashed the original and all three
final outputs, verified the branch outbox as `done`, the publication and
artifact as `ready`, staging removal, one validated attempt and two contiguous
checkpoints. The inspector's first two read-only invocations rejected a valid
marker because its UUID expression omitted the fourth group. After correcting
that expression, it passed twice on the same retained state; the model was not
run again. This separate inspector defect and repair are retained in the
Auralis record and evidence report.

## Checks and open gates

- `task desktop:e2e:native:translation:history:staged-gap`: first test-hook
  invocation failed as above; the one bounded repair passed with exit 0.
- `task host:publication:native:inspect`: passed twice on retained data;
  report SHA-256 above.
- `task host:publication:native:check`: passed 9 application tests and both
  JavaScript syntax checks after the hook correction.
- `task host:publication:uncertain:check`: passed 9 application and 8 storage
  tests for deterministic commit-response failure cases.
- `task rs:fmt`, `task rs:clippy:native-e2e`, `task docs:check`, and
  `task media:verify`: passed for the affected Auralis candidate. The first
  sandbox-only media invocation hit process-spawn `EPERM`; the same task passed
  with process permission.

This establishes one native staged/outbox interruption boundary. Other
publication interleavings, natural long-file quality, independent language
review, real listening, cue fit, a clean Windows install and final RELEASE-05
remain open. The Auralis branch has not been pushed.
