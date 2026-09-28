# Explicit scene-map admission slice

Status: partial `CTX-02` engineering evidence, 28 September 2026. This is
not a real translation-quality or `LONG-01` token-budget acceptance.

The SRT planner now accepts a full-coverage sequence of scene-ending internal
segment IDs. It rejects empty, duplicate, reversed, foreign and incomplete
boundaries. Every target remains covered once, while preceding/following
source context is clipped to its scene. Existing SRT plans without an explicit
map retain their old block and policy identity.

`translate-v5-scene SOURCE STATE_DIR PROFILE SCENE_MAP SERVER_URL OUTPUT`
accepts a JSON map with `schema_version: 1`, the exact source SHA-256, a
nonempty evidence ID and `scene_end_ids`. The map is checked against parsed
SRT before state creation, copied into the managed state and bound by raw and
structural hashes to the run policy. Resume reads the managed copy and rejects
changed boundaries or even changed evidence bytes. The external map path is
not used for resume. V5 file context without an explicit map still fails
before state creation. VTT and non-v5 profiles cannot use this command.

`task test:scene-map` passed three domain cases, two SRT format cases and two
CLI process cases. The CLI case used an unavailable loopback server after
freezing state to exercise resume and tamper rejection; it did not generate a
translation. `task lint` passed after resolving range and argument-count
warnings. `task test:context-v5` passed existing adapter/profile/CLI checks.

Later [paired real scene evidence](2026-09-28-scene-context-results.md)
measured model requests and rendered-token counts, and exposed a semantic
actor-number defect. Open work: target/batch budgeting, approved terms,
failed-attempt retention and real long-file evidence. No human reviewer has
accepted scene semantics or Russian output.
