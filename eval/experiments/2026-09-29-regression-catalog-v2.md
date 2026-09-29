# Complete development regression catalog v2

The original [index v1](../regressions/index-v1.json) is a narrow historical
REG-001 prompt-copy record and its validator checks that exact case. The
[catalog v2](../regressions/catalog-v2.json) lists REG-001 through REG-009 in
ID order with pinned pack SHA-256, source family, development split, category,
affected profile scope, expected invariant, severity, control counts, evidence
record and current outcome. Historical pack files remain unchanged. REG-008
has a v2 pack that retains every v1 field and adds a negative control;
the catalog checker verifies its pinned parent hash and retained contents.
`task eval:regression:catalog:check`
verifies identities, evidence links, contiguous IDs and controls; it is also
part of `task eval:regression:check`.

The first catalog audit exposed a policy gap: REG-008 had three related
child-process controls but no separately declared negative control. The v2
pack now records that an omitted environment must fail before child creation;
the helper enforces it and `task eval:long:postflight:check` exercises it.
The original failure report and v1 pack remain pinned and unchanged. All nine
catalog entries now have explicit related and negative controls. This does
not claim all semantic cases passed, make old reports human reviewed or
complete the broader adversarial tiers in policy 008. `EVAL-04` stays open.
