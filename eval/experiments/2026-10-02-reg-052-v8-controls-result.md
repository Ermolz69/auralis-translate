# REG-052 real v8 controls: name drift and a new context verb intrusion

Date: 2 October 2026. Frozen [plan](2026-10-02-reg-052-v8-controls-plan.md);
all 24 raw candidates and measurements in the [public report](../reports/2026-10-02-reg-052-v8-controls.json).
The ignored private `report.json` SHA-256 is
`96ac8d1b1b6c126b3e66052702560ff9b1aca30d0809ac1b59ce0f5a2b161ebf`.
It retains each complete request/response and 48 rendered-template/tokenizer
preflights. The harness SHA-256 is
`1ca826e9f6811b53175447be3f12d4bec2b9ae079d16d100ee18f63112c0de1b`.
The pinned model, runtime, manifest, earlier v8 CLI request and source pack
identities are in the plan and checked by
`task eval:regression:v8:name:check`. No English expected meaning entered a
model request. This is source-aware AI triage; human bilingual reviews: **0**.

The real Hy-MT2 1.8B Q4_K_M server returned 24/24 structurally valid JSON
responses under the correct target ID, using six previously frozen authored
cases, seeds 101/202, and paired context on/off. There were 24 chats, 48
preflights, no transport/format failures and no retries. Context-on used
3,284 prompt / 473 completion tokens and 4,692 ms summed chat HTTP time;
context-off used 2,408 / 465 tokens and 4,488 ms. Wall time was 13,244 ms.
Three sparse samples reached 1,561,133,056 bytes server working set and
3,719 MiB device-wide GPU use; these are not isolated peaks. The two
context conditions have different prompt lengths, and this is not a speed
or natural-scene comparison.

| Frozen case | Source-aware AI observation of four raw candidates |
| --- | --- |
| Other Xiao name, hand document to Doctor Chen? | The actor name varies across all four. With context on and seed 202, `Заплатил ли Чжан Сяо документ доктору Чен?` borrows a payment verb from the neighboring ticket-price cue. With context off, the paired candidate begins `Раздал ли…`, still not a reliable rendering of handing over. This exact new failure is `REG-053`. |
| Xiao Li did **not** hand the key to Wang | Negation and key action remain in all four, but the name alternates between `Сяо Ли`, `Ли Шаоли` and `Ли Шао Ли`. |
| Wang asks where Xiao Li is | All four shorten 小李 to `Ли`, losing the name form. |
| Full name 李小明 asks about the key | All four retain a distinct full name; one context-on candidate changes its spelling to `Ли Сянмин` while others use `Ли Сяомин`. |
| Unnamed actor asks about the key | All four keep the pronoun and question without inventing Xiao Li. |
| Xiao Li left the key on the table | All four retain the declarative sense and `Сяо Ли`. |

The fixed neighboring cues intentionally stress targets with different
actors or actions. They are not natural contiguous scenes, so a single
context-on intrusion cannot estimate frequency on real subtitles. The
opposite clean controls matter: the model did not invent a name in the
unnamed-actor question and handled the Xiao Li declarative. The result
nevertheless falsifies any claim that v8 solves name fidelity, Russian
question form or all context contamination. REG-052 remains open; REG-053
pins the new minimum and six related/negative cases for future model runs.
No candidate is accepted as a final translation or spoken script.

Next experiment should compare the **same** name/hand-over questions on an
independent local model, then test whether an approved source-scoped name
form can stabilize rendering without leaking it into unrelated actors.
Only after those development checks should a natural long-file v8 seam
comparison proceed. Independent human review, listening and clean target
validation remain separate release gates.
