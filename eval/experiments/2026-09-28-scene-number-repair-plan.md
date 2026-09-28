# Predeclared scene actor-number repair probe

Status: frozen before inference on 28 September 2026. This is development
data, not a release holdout or human review.

The observed `REG-002` defect is a singular Chinese actor becoming a plural
Russian verb in three distinct scene contexts. This probe changes only the
v5 instruction to preserve explicit referent number and avoid inventing an
actor when source context is insufficient. The model, runtime, Chinese SRT
source bytes, scene maps, decoding settings and 2,048-token budget remain the
same as the retained `scene-pronoun-regression-v1` run. The old raw report and
profile hashes are immutable comparison evidence; this run gets a new
experimental identity and profile hashes. References and expected facts stay
outside all model requests.

Run `task eval:context:scene:number-repair` once on `r01`–`r04`, with the same
no-context and one-before/one-after arms. Budget: eight complete files, at
most 26 chat requests, 80 total loopback requests, one model startup and ten
minutes after readiness. Stop and retain output on any structural, source
integrity, tokenizer, export, or resource failure. Check the singular cases,
the explicit-plural negative control, and all source slots; a wording change
alone is not success. No further prompt edits or retries belong to this
probe. Independent bilingual adjudication remains necessary.
