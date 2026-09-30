# ASUS 268-cue full-file diagnostic stopped at cue 227

Date: 30 September 2026. Partial `DATA-03`, `CTX-02`, `LONG-04` and
`EVAL-04` evidence under the [predeclared plan](2026-09-30-commons-asus-full-probe-plan.md).
The exact Chinese SRT revision `892592485` is SHA-256
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`;
its private matching 240p video is SHA-256
`9e4271f8112de2fa65ad67c4cec3390529e916d70363bc5f4c421f4479b97cc1`.
Rights, speech alignment, scene boundaries and human review are unresolved.
No reference, expected Russian answer or reviewer output entered model requests.

The first Taskfile attempt passed source/media preflight and the release build,
then failed at the initial `git` child-process launch with sandbox `EPERM`:
zero model calls and no server process. Its private report is SHA-256
`c05c04282b664e49ded7cd6d2d9da662729102292adcea1773ec2f46da754b30`.
The permitted same-byte rerun was the sole inference repetition. Its private
workspace is `.cache/eval/commons-asus-full-7b-v1/run-nCoZTy/`, report SHA-256
`d86f4264ae1c65f3508c3c8539cdcee3fd4fcae9de1fbc14ee0d83e02bc216ba`.
The checked 7B Q4_K_M model SHA-256 is
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`;
runtime `6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`,
v5 profile `9b34d86d3b0d872720ee729131efef99281e71a0000d202abea169d625a92e73`,
release CLI `82df0fbd0167b9163f945c58d8387a1edf2c6eedfed9f38086f617f74914df1d`.
The run used a provisional one-video source scene, a 2,048-token context and
one neighbor cue on each side of the target, without approved terms or speaker IDs.

Run `bf1e6130-6674-4538-ba9f-6243bc164760` saved 226 ordered durable
checkpoints and stopped on the 227th chat. The 227th response used 305 prompt
and 69 completion tokens, `finish_reason=stop`, and 1,250 ms measured HTTP time.
Its request SHA-256 is
`945dda8849ffbfd948794a01311e94274e4f00b388a214025dfb709c7e226848`;
raw response SHA-256 is
`fe6162424bae4ec19511a173dafb0cdef7f6e3bffd37497609313040176185a6`;
extracted candidate SHA-256 is
`268abfbddfb6f202b44a33d5022c43b42d74110ff5faf38d9564bbc113770167`.
The 226–228 source window SHA-256 is
`9fef4c9d85cbb607efac39f0e123070ea0b1c27c7d1f2cd4404156a6b09bc14a`.
The model returned a parseable one-slot JSON envelope with target ID 227,
but inserted an invented `」}]}` JSON-closing fragment into the translated
target. The source contains no such braces. The SRT grammar guard rejected it
before checkpoint 227; SQLite has zero complete results, no candidate SRT was
written, and the failed DB SHA-256 is
`5251f0900da2858e9c51568d7143c4a3e2b23544949378ce011ba6029119c30a`.
This repeats the model-output class in [REG-024](../regressions/natural-vivo-json-tail-v1.json)
on a distinct long natural source; [REG-029](../regressions/natural-asus-json-tail-v1.json)
pins the new minimal window and independent watt/core positive and negative
controls. Existing guard behavior is correct, but the long run is incomplete.

The failed run made 227 chat and 684 total proxied HTTP requests, using 65,874
prompt and 11,214 completion tokens. Summed chat HTTP time was 193,925 ms;
the translation CLI command lasted 271,459 ms. One-second samples (N=255)
peaked at 5,068,865,536 B server working set and 5,745 MiB whole-device GPU
use. The GPU figure includes other applications and is not process-exclusive.
No result was published, no natural-language quality score exists, and no TTS
script was approved. A copied-state resume requires its own pinned budget,
prefix proof and separate evidence; it is not silently folded into this run.
