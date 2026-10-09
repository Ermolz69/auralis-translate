# Vivo private real-TTS rate audition packet: ready for listening

Date: 10 October 2026. Auralis local `feat/natural-tts-pilot` commits
`d7afd9b` and `7ca79a9` froze, built, checked and documented a private
audition packet from the earlier real SAPI rate screen. The exact Auralis
records are `docs/voice/052-natural-vivo-rate-audition-plan.md` and
`docs/voice/053-natural-vivo-rate-audition-result.md` in its local worktree.
The [source-free public summary](../reports/2026-10-10-vivo-rate-audition-v1.json)
records hashes; the Chinese/Russian text, nine WAVs, player and rating form
remain local and unpublished.

One 7-ms copy operation selected cue IDs 1, 233 and 466 from the start,
middle and end of the 18:36 Vivo source. The same unreviewed Russian text
appears at SAPI rates 0, 5 and 10 in each group. A/B/C options rotate rates
to permit a private blind comparison. No new TTS/model/ASR/media/playback
request occurred. The independent
`task voice:natural:vivo:rate:audition:check` byte-matched and decoded all
nine WAVs, verified exactly nine local player references and checked that
all reviewer and score fields were null. `task
voice:natural:vivo:rate:audition:lint` and `task docs:check` passed; a
sandboxed `docs:check` attempt failed at `spawn EPERM` before its
process-permitted retry passed.

The private manifest SHA-256 is
`44142dc37dc15f0a3085296cbe227784b824a964a7c1ea30bf082fd67c5c2387`,
player HTML SHA-256 is
`152911bc07419123d5775f35df6e513ae92e701910353e56e719bf3c92250615`,
and blank worksheet SHA-256 is
`9ce3d040cb6ba6479f5e6857c93bd56b757af3ed6cb8bd3e5f770f4818fa8092`.
The source SRT, Russian draft, TTS report and analysis retain the hashes in
the public summary. The private packet lives in Auralis at
`.cache/voice/natural-vivo-audition/packet-378a494e-685b-49c9-b246-66be63facf18/`.

No person has listened to or rated these clips. Three short excerpts do not
establish the three fully reviewed 10–20-minute scenes required by A4.
The spoken script and translation remain unreviewed; source rights and
all A1–A6 audio gates remain open. This packet does not change product v8,
the two complete `needs_review` SRTs, Auralis's default SAPI rate 0 or
the previous full-media pilot. Rollback is a new default-rate run while
retaining every source and prior audio artifact.
