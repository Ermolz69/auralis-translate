# Translation quality improvement and model selection plan

Status: proposed work with a first local comparison, 27 September 2026. The
[matched 1.8B/7B Q4 development experiment](../../eval/experiments/2026-09-27-model-size-comparison.md)
now has real evidence; the wider precision matrix and language gate remain open.
This plan complements the
[product plan](../PRODUCT_PLAN.md), [stage gates](../IMPLEMENTATION_STAGES.md)
and [language evaluation protocol](001-open-data-and-language-gates.md).

## Recommendation before implementation

Evaluate **Hy-MT2-7B Q4_K_M** as the first higher-quality candidate for the observed
RTX 3070 with 8 GiB VRAM. Retain 1.8B Q4 as the small/fast candidate. Select a
default only after comparing real accepted translations, failures and resources
on this machine. The existing 1.8B output is useful as a draft but its observed
negation, idiom and grammar errors prevent calling it ready for unattended use.

The question's "8 million" is assumed to mean the 7–8 billion class (8B). Eight
million parameters would be much smaller than the current 1.8 billion. Tencent
names the candidate 7B; the Hugging Face model page displays an 8B parameter badge.
Do not substitute an arbitrary general-purpose 8B model based on size alone.

## What published evidence supports

The publisher's [technical report, Table 5](https://arxiv.org/html/2605.22064v1#S3.T5)
compares the same Q4_K_M quantization across model sizes:

| Publisher benchmark | 1.8B Q4_K_M | 7B Q4_K_M | Score difference |
| --- | --- | --- | --- |
| FLORES-200, Chinese ↔ other languages | 82.22 | 88.96 | +6.74 points |
| Translation instruction following, IFMTBench | 63.47 | 75.11 | +11.64 points |

These are publisher-reported aggregate benchmark scores, not the fraction of
correct Chinese-to-Russian subtitle cues and not a prediction for our examples.
The same table reports 7B BF16 at 83.14 on IFMTBench versus 75.11 for Q4. Thus
quantization can still materially affect constraints even in the larger model.
More parameters do not imply a universally better quantization algorithm.

Q4_K_M is a mixed low-bit weight format, not exactly four bits for every tensor.
Q6_K and Q8_0 retain more numerical precision at increased storage and memory
cost. Test their translation effects rather than assuming that more bits repair
training, scene ambiguity or every Russian grammatical defect.

Current official files, checked 27 September 2026:

| Candidate | Approximate file size, decimal GB | Planned role |
| --- | --- | --- |
| 1.8B Q4_K_M | 1.13 | Measured current baseline with v4 protection |
| 1.8B Q8_0 | 1.91 | Isolate quantization effects without changing model size |
| 7B Q4_K_M | 4.62 | First larger-model candidate |
| 7B Q6_K | 6.16 | Conditional follow-up if measured VRAM headroom is sufficient |
| 7B Q8_0 | 7.98 | Not the initial 8-GiB target; too little room for runtime overhead |

Sizes come from the official [1.8B files](https://huggingface.co/tencent/Hy-MT2-1.8B-GGUF/tree/a0c709d9fac510f2c807aa3af52872340dc37a4a)
and [7B files](https://huggingface.co/tencent/Hy-MT2-7B-GGUF/tree/ab8472660ac61fac25f1af43fac2599d52a8a775).
They are download sizes, not measured peak VRAM. For example, 4.62 decimal GB is
about 4.30 GiB. KV cache, compute buffers, desktop use and other applications also
occupy VRAM. Full GPU placement, actual headroom and speed are unverified.
Start with a bounded 2048-token context and one inference slot; separately test
4096 tokens when evaluating scene context. Do not equate a RAM-cached model with
full GPU residency or use CPU spill as an undisclosed performance comparison.

## Existing evidence and gaps

- The [authored report](../../site/index.html) has twenty development phrases,
  AI-proposed references and Google observations. Those are useful regressions,
  not independently reviewed human references or an unseen test set.
- [Currency protection](../../eval/experiments/2026-09-27-chinese-currency-protection.md)
  preserves the observed yuan price and twenty controls through repeated real
  runs. Its parser covers bounded forms; grammar, idioms and negation remain open.
- v4 is an explicit standalone profile. The currently installed desktop package
  still pins v1. Existing v2/v3 context/glossary profiles are experimental; the
  first glossary smoke did not reliably obey its requested term.
- Chinese is the current durable file path. Japanese requires its own admission,
  prompts, corpus and quality evidence; Chinese money heuristics must not be used
  as a Japanese-language correctness claim.

## Ordered work and acceptance

### 1. Freeze regressions and prepare real development scenes

Preserve the forty authored phrase/control inputs as a fixed regression set.
Add independent examples for double negatives, abandoning versus postponing,
Chinese names versus Japanese readings, idioms, irony, pronouns, giving change,
mixed currencies, unrecognized monetary forms and split sentences. Separate
money correctness from surrounding meaning and Russian fluency in review.

Follow the existing collection target: roughly 20–30 licensed scenes / 500
Chinese cues, about 200 development and 300 held out by video/scene. Record
provenance, original bytes, timing, references and bilingual review status.
Commission or obtain source-language/Russian review before assigning adequacy
scores. Keep all content from one video in one split. The release holdout cannot
be used to select a model or tune a prompt; public FLORES remains auxiliary data.

Done when development records are reproducible and reviewable, scene splits are
frozen and an unseen release set is reserved. Unreviewed examples remain marked
unreviewed; there is no fabricated human accuracy percentage.

### 2. Compare model size and quantization with controlled inputs

Use this initial matrix, retaining source protection identically across variants:

| Order | Variant | Question |
| --- | --- | --- |
| A | 1.8B Q4 + v4 | Current protected baseline |
| B | 7B Q4 + the same protection/prompt policy | Does model size improve meaning and fluency? |
| C | 1.8B Q8 + the same policy | How much of the remaining error comes from quantization? |
| D | 7B Q6 + the same policy, conditional on resources | Is its precision gain worth the extra memory? |

Acquire weights separately from official upstream files, pin revision/size/SHA,
and create new manifests. Verify architecture/template/runtime compatibility with
the installed llama.cpp build before assuming the 7B model works. If a different
runtime is required, compare both models on it and report the runtime change.
Do not overwrite old manifests, selected-package markers, runs or checkpoints.

First run the forty development regressions three times per admitted variant,
then compare on frozen development scenes. Keep sampling/context policy equal
for the size/precision comparison. Run each model sequentially on the same
backend, note background GPU use, and separate cold process startup from warm
translation; no unexplained claim of a cold OS cache. Measure load/startup,
accepted full-file time, per-request p50/p95, raw tokens, sampled/observed peak
resources, retries, token failures and offline exports. Preserve all failures.

Instrument preparation, GGUF hashing, inference, persistence and export separately.
The current file-time-minus-HTTP residual is not an isolated hashing measurement.
Use those measurements to remove repeated work within verified immutable-package
and attempt boundaries; do not replace integrity checks with an unsafe global
file-metadata cache. Benchmark small cue batches only as a separately versioned
variant with exact target-ID checks and no movement of text between cue times.

Blind model names during bilingual review. Report errors of meaning, negation,
omission/addition, actor, amount/currency and grammatical form separately, with
denominators. Automatic metrics are supplementary and cannot replace that review.
If differences are too small or disputed, expand development review before
choosing a winner. No local speed or quality improvement is promised in advance.

Done when a complete comparative record identifies the quality/resource tradeoff
and a preferred development candidate, or explicitly concludes that the evidence
is insufficient. Retain a smaller profile if the larger one is impractical.

### 3. Make context, terminology and source protection composable

Design and document a new versioned profile contract before implementation.
Currently v4 excludes context/glossary, while v2/v3 use separate prompt wrappers;
they cannot simply be enabled together without a new contract.

Use a bounded scene window, initially two previous cues and one following cue,
within the profile token budget and scene boundary. Context is read-only evidence;
translate only the declared target text slots, preserving IDs and timings. Check
that neighboring words are not copied into a target or assigned to the wrong cue.
Provide confirmed names, character register and domain terminology with scope
and allowed Russian forms. Do not force every 小林 to one reading without evidence.

Keep monetary protection as an independent preparation/validation operation.
Measure grammar around protected amounts; blindly inserting more protected nouns
can damage case agreement. Expand bounded numeric parsing only with supported
syntax, ambiguous-use controls and actual model evidence.

Compare the selected model's plain/protected/context/terminology combinations on
development scenes. Use official terminology/context templates as candidates,
not as assumed fixes. Keep any changes in per-run fingerprints. Avoid injecting
the test set's full expected translations into prompts or adding blanket Russian
word replacements for each benchmark defect.

Done when scene-sensitive meaning/terms improve under review, protected facts and
cue assignment remain intact, and the old profile fingerprints still reproduce
their saved results. Failed composition tests are retained in the comparison.

### 4. Deliver the validated profile through the actual desktop path

Create separately versioned verified packages and explicit selection for a small
profile and a larger quality profile. Install weights separately, show size and
declared hardware needs, and never silently change a current run's model. Use
existing Auralis runtime/resource ownership to serialize contention with ASR/TTS.
Keep cancellation responsive and make OOM/resource failures explicit.

Initially expose a chosen candidate as experimental. Changing the recommended
default requires the later quality/hardware gates, rather than a model-size label.
Integrate protected-currency behavior into the selected desktop package; testing
only the standalone CLI does not establish the user-facing fix.

Done when native UI installation/selection, fresh translation, pause/resume,
restart, artifact attachment and immutable historical results work with the new
profile. Verify the source/result/profile provenance across both databases.

### 5. Improve review and publish comparisons people can inspect

Show original, neighboring cues, accepted Russian result and actionable review
flags. Allow scoped names/terms and explicit edits without rewriting prior results.
Prioritize possible negation reversals, missed protected facts/terms, omissions
and cue mismatches. Treat semantic flags as review leads with false positives,
not confidence percentages. Rerun selected cues under a new run/result identity.

Extend the single-HTML Pages report with model/quantization/context selectors,
side-by-side accepted results, exact timings, error-review provenance and raw JSON
downloads. Keep independent human references distinct from AI proposals and Google
observations. Preserve the old published baseline and failed variant outcomes.

Done when a reviewer can reproduce a comparison, see its limits and trace any
result to model/runtime/profile/corpus identities and its source file.

### 6. Freeze a release candidate and run the untouched language gate

Follow existing G1–G9: 100% supported structure preservation, explicit outcomes,
at least 95% of eligible reviewed holdout cues at adequacy ≥4/5, no unresolved
critical holdout error and at least 98% applicable approved-term adherence.
Select numeric performance targets only after profiling the declared hardware.
Complete native durability, target-consumer export and clean offline installation.
If holdout evidence leads to tuning, retire that set into development and acquire
a new holdout. Repeat the entire language process separately for Japanese.

Done when the candidate has both engineering and independently reviewed language
evidence on the declared platform. Keep the production default unchanged if it
fails. A larger model and a green build do not satisfy these gates on their own.

## Immediate next deliverable

Prepare the pinned A/B manifests and controlled forty-example comparison for
1.8B Q4 versus 7B Q4. In parallel with data preparation, define the desktop package
upgrade that exposes protected currencies without rewriting saved runs. This plan
does not download weights, execute a larger model or change the installed default.
