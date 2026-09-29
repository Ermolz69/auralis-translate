# Source clock-time diagnostic v1

`time_mismatch` is an advisory checkpoint diagnostic for a translated target
line whose 24-hour `H:MM` or `HH:MM` clock-time multiset differs from its source
line. Leading zeroes on the hour are ignored; duplicate occurrences matter.
Only values with hour 0–23 and minute 00–59 are recognized. ASCII letter,
digit or underscore adjacency excludes an embedded code; adjacent Chinese or
Russian text is allowed. Context lines never contribute expected times.

This catches the archived cue 129 substitution, where a structurally valid
response copied the next cue and lost `08:10`. It also catches a wrong time
without depending on an ASCII project identifier. The accepted raw text is
unchanged and persisted with the diagnostic. Existing profiles retain their
prompt, response and retry identities. Historical checkpoints are not rewritten.

This narrow rule does not interpret Chinese written-out times, date formats,
time zones, ranges or narrative meaning. It can flag an intentional time
conversion; human review decides whether that is correct. A warning is not a
release approval, and absence of a warning is not proof of adequacy. Any
future strict rejection requires a separately versioned policy and measured
completion behavior.
