# Free opt-in bilingual review packet for Paywall development cues

Date: 2 October 2026. This is an execution aid for the [no-budget reviewer
route](2026-10-02-no-budget-human-review-route-v1.md), not an independent review
or a release holdout. No invitation has been sent and no person has consented.

## Invitation text to use only after outreach is authorized

> We are developing a Chinese-to-Russian subtitle translator in a commercial
> project and would value voluntary feedback on four short written Chinese
> subtitles and two Russian candidate versions of each. This first exercise
> should take about 15–20 minutes. A further eight subtitles are optional.
> There is no payment, obligation, or promise of reciprocal work. We will ask
> you to state whether you read written Chinese and Russian and to cite the
> Chinese words behind any meaning error. The material comes from CC BY 4.0
> Traditional Chinese subtitles credited to Sau-Chin Chen for Jason Schmitt's
> *Paywall: The Business of Scholarship*. The film speech is English; this
> exercise tests written Chinese, not the original voice track. We will keep
> your identity and detailed answers privately, and publish only pseudonymized
> counts and error categories unless you separately allow quotations. You may
> withdraw your private answers before a public aggregate is published; a
> previously published aggregate cannot be retracted from copies. Please reply
> only if you agree to this use and have the time and language background.

The coordinator records an explicit opt-in, a stable private reviewer ID,
Chinese/Russian self-report, date, packet SHA-256 and any later withdrawal
before sharing the private packet. Self-report is not proof of proficiency.
The four trial cues check whether a volunteer can cite the Chinese source and
explain the Russian meaning. Do not count incomplete or AI-generated answers
as independent human review. A second bilingual person is still required for
critical or disputed judgments. Russian TTS listening is a separate role.

## Prepared private material

`task eval:review:paywall:packet:create` creates one immutable packet under
`.cache/eval/paywall-volunteer-review-v1/`. It binds the original 880-cue SRT
and the frozen 1.8B/7B reports from the [matched screen](2026-10-02-paywall-bilingual-review-seed-results.md).
The packet contains 12 original cue IDs across the fixed beginning/middle/end
windows, source timing, adjacent Chinese text and two Russian candidates per
cue. Candidate A/B order is randomized and balanced six ways per model; the
model mapping is in a separate private file. A blank form has 24 unscored
candidate judgments. No reference or expected meaning is given to the models.
The packet is development material with unverified scene boundaries and no
admitted release source. Its contents must not be copied into the sealed
holdout or presented as a Chinese-speech dubbing pilot.

`task eval:review:paywall:packet:check` verifies the original/candidate hashes,
ordering, model separation, and empty judgments. The receipt hashes identify
this local private packet without exposing the A/B key on GitHub Pages.
The coordinator should distribute only the reviewer packet and blank form to
an opted-in person, retain the key privately, and collect a new immutable
response file; never overwrite the blank form. No distribution is authorized
by preparing this material.
