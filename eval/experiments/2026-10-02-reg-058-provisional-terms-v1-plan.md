# REG-058 provisional manufacturer terminology screen

Date: 2 October 2026. Experiment ID `reg-058-provisional-terms-v1`.
The owner declined volunteer contact. This is an authored ASUS development
screen, not an independent Chinese–Russian review, a holdout or a release gate.
It follows the rejected generic instruction screen and does not alter the v8
product profile. The original natural Chinese source SHA-256 is
`923aed3991c2308d92b89c45181cea8ec7ece74e9b4d3a3ce0234d95e329913b`.
The original v8 natural report SHA-256 is
`9ae192177dd51611f49adf7699ca4fe9677a230dc74cbdedded2618040cc193c`.
The parent REG-058 pack SHA-256 is
`fcba9d337e8bdf3dd0d431cf886917bcefa999a44d9eb30fcc5450a6147ebe09`.
The frozen ten-control pack SHA-256 is
`b4cd39caae1bbac13847d9a5ee2cb8e21993882d0342cc710a9cb44957a9d344`.

## Source and interpretation

ASUS's [Chinese ROG GM50 page](https://rog.asus.com.cn/mice-mouse-pads/mouse-pads/rog-gm50-mouse-pad-model/)
uses `鼠标垫` for the same product that the
[Russian ROG GM50 page](https://rog.asus.com/ru/mice-mouse-pads/mouse-pads/rog-gm50-mouse-pad-model/)
calls `коврик для мыши`. The
[Chinese ROG Dominus page](https://rog.asus.com.cn/motherboards/rog-dominus/rog-dominus-extreme-model/)
distinguishes `多核` processor cores from `多线程` workloads. A separate
[Russian ROG Zephyrus M16 page](https://rog.asus.com/ru/laptops/rog-zephyrus/2021-rog-zephyrus-m16-series/)
uses `многоядерный тест` for a CPU benchmark. The second pair is a
source-family terminology inference across different products, not a
sentence-level bilingual manufacturer translation. The web pages are evidence
for a **provisional** glossary, not proof of approval by a reviewer, publication
rights for the subtitle source or translation quality.

## Frozen single factor

Compare the unchanged product v8 request with the same request containing
only this extra instruction before `Input JSON`:

> Manufacturer terminology for this ASUS source family (provisional, not reviewer-approved): 多核 = многоядерный (processor cores, not threads); 鼠标垫 = коврик для мыши (surface for a mouse, not a stand). Apply only to a matching Chinese target term and keep contrasts and negation intact.

The instruction has one trailing space. Its exact SHA-256 is emitted by
`task eval:regression:reg058:terms:preflight` as
`dffd8ca1d0096d389c0fd6ddc3f761b2032ef1274b0f3355d1c33972289601f7`.
This is an explicit experimental
term hint; `approved_terms` remains empty. Full-sentence expected meanings,
model answers and Russian reference sentences do not enter the requests.
The manufacturer term forms do enter the terms arm, so scores on terms directly
given to the model cannot independently prove general translation quality.
No closed holdout is used. Both target source fields receive exactly the same
Chinese control. The source-only neighboring context, model, target IDs,
schema, temperature and decode settings remain the same. Control order
alternates the arm order within one server process.

Ten frozen controls: the previously wrong multi-core and mouse-pad positives;
their multi-processor and stand negatives; two known related controls; and
four new contrasts covering cores versus threads, missing score and negation,
pad versus stand, price and out-of-stock status. Expected meanings live only
in the control pack and offline reports.

Use only Hy-MT2 7B Q4_K_M SHA-256
`9f96256500f3fc1ab4d64336b58f52a949a95ad7516b0c229476eef782f9f77b`,
manifest SHA-256
`a748572cea20fc46c53ced5c39c5b8e3fb85887c2e90d559a27fd41ea818f2bc`
and Windows CUDA llama-server SHA-256
`6f15be27bd80b6b4d52afefa49094e18fcfab55d5da354d717971f2d2537b2f4`
on the local RTX 3070 8 GiB. One sample per arm and control: at most
20 chats and 40 template/tokenizer preflights, 256 response tokens,
2,048 context tokens with 64 safety tokens, 120 seconds per chat, 15 seconds
per preflight, three minutes readiness and ten minutes total. One model attempt,
zero retries, zero prompt search. Retain a failed run; do not quietly relaunch.
Record exact raw requests/responses, hashes, tokens, times, sampled resources,
structural acceptance and separate AI-only meaning observations.

Advance to a separately frozen full-file development comparison only if all
20 outputs have valid structure, both formerly wrong positive concepts are
correct in the term arm, every new contrast preserves referents, negation,
numbers and relations, and neither known negative gains a material error.
If this rule fails, retain the variant and keep v8 unchanged. If it passes,
it only justifies a bounded new natural 268-cue development run with
beginning/middle/end, seams, names, amounts and scene checks. It cannot close
G3–G9 or A1–A6 without admitted source, independent review, approved script,
real listening, release hardware and clean-install evidence. No volunteer
outreach will be made.

Run `task eval:regression:reg058:terms:preflight`, then the single
`task eval:regression:reg058:terms:probe`, followed by `:report` and `:check`.
