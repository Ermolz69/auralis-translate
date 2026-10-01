# Frozen 7B restaurant JSON-tail retry screen

Date: 1 October 2026. Partial `CTX-02`, `CTX-05`, `LONG-04` and `EVAL-04`
development screen. This is one fresh 263-cue run, not a sealed-holdout or
human-quality measurement. It asks whether one opt-in retry for an exact
leaked `」}]}` wrapper tail lets the current 7B pipeline complete a source
that previously stopped at cues 62 and 100. No answer trimming or acceptance
rule changes.

The private source SHA-256 is
`4777e11caa115e893f2328c2a33c25a76c7391ace8ecf0ac4b9436635fc27964`,
the immutable 271-cue parent is
`077aef6a49aa7128f5ddd349f38ffc84dd669f5e4bbfae6d692efa2d78304967`,
and the derivative mapping is
`da63dec61c03ccbfcc307aa028e9499b8ba9a65de41c1df6b0daab5a629a9a4f`.
The 12:18 video is
`6e29f1512a76f553bdfc1678f458a69cf010e4653ac3f1cdfc4c45742bfb39d6`.
These are unassigned development material. Subtitle rights and Chinese speech
alignment have not passed independent review; the source and output remain
private.

The GGUF is Hy-MT2 7B Q4_K_M at model revision
`ab8472660ac61fac25f1af43fac2599d52a8a775`, SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`.
The llama-server executable SHA-256 is
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`.
The opt-in manifest SHA-256 is
`af9296ac5bbd089d82a44eaeb4afa2e144f013ce727bd4bf1c2de76ca615cbae`;
its only differences from the baseline 7B v6 manifest are
`retry_json_tail_once: true` and `max_block_attempts: 2`. The source, scene
map, prompt, schema, model, runtime sampling settings and tokenizer preflight
stay the same. `task eval:cli:build:receipt` passed before inference and
retained receipt SHA-256
`7d07a44d26f54940c033048f4e4320bec6bf2e033ee8c0a36c863ebc0902724a`.
It binds source commit `9abf5222f2653b129e8558b60ac71d25aded9697`,
365 source files, tree SHA-256
`4c2faed216e600f9d7641cb507e3fade4e05d78e492ec7e51bb1f34ea2b4dad8`
and release CLI SHA-256
`69d9a90508dca50a639148ca69cc62b08614691a82ac8a982641f3d2425578d0`.
The runner verifies its CLI against that receipt. Sampling seed remains unknown
because the CLI does not set one.

One new SQLite state and one server start are allowed. The budget is 526
chat requests, 1,600 total proxied HTTP requests, 20 minutes model-stage wall
time, 130 seconds per upstream request, 180 seconds readiness and 600 seconds
doctor. At most two chats per block are permitted by the checked manifest;
there is no third attempt, alternate model, temperature change, copied state
or post-hoc text repair. A zero-chat infrastructure failure can be rerun once
with the failed report retained and identical bytes. A model/content failure
ends this screen. The original, failed historical states and historical CLI
receipts remain immutable.

The runner retains raw HTTP request/response bodies, token counts, timings,
resource samples, CLI stdout/stderr, state, attempt count and a separate output
only if validated. Compare exact overlapping source cues with both archived 7B
attempts and report every new retry, regression and unmatched cue. The earlier
CLI predates the provider tail guard, so historical comparisons are useful
development context but not a controlled code-only ablation. Expected meanings
for AI review include names and roles at cues 11, 32 and 125; 30 dim sum and
8 desserts at cue 35; 50 staff at cue 22; 120 wines at cue 219; 2,500 metres
at cue 223; negation at 70, 80, 119, 233 and 254; and beginning, middle,
end and scene seams. These notes never enter prompts. AI triage remains
separate from an independent Chinese/Russian rating, which is unavailable.
