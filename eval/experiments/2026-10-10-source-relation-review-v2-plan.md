# Source relation review v2: frozen shorthand-availability replay

Date: 10 October 2026. `REG-071` is a new false negative in the
evaluation-only v1 diagnostic, exposed by the frozen focus-slot model
comparison. With source cue 465 expressing expectation and cue 466 describing
products that cooperation could bring, the saved focus answer starts with a
bare present-availability assertion. The v1 rule warns on the batch answer
but misses this shorter answer. No model prompt or product profile changes.

Use the same pinned 467-cue Chinese SRT, completed v8/7B draft, 36-chat
prior journal and new 20-chat focus journal. Maximum replay: the full draft,
the six saved natural 276/280/466 replies from v1 and the two new cue-466
batch/focus replies; zero model/ASR/TTS calls, zero retries. Rehash private
inputs. Add only a conservative target-language pattern for a clause-opening
bare "there are better products" assertion when the existing source rule
recognizes future expectation. Keep all v1 warning classes and all v1
controls. Add related target forms and negative controls for hope/negation,
explicit present availability and nonadjacent source context.

Admission is evaluation-only if v2 warns on the new focus false negative,
retains the v1 warnings, abstains on authored negatives and reports all
additional full-file warnings as unconfirmed. This exposed-source replay
cannot measure precision on other natural sources or approve G3–G5.
