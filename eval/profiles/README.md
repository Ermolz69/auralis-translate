# Historical measured profiles

The three `2026-09-28-*` JSON files are byte-for-byte snapshots of the v5
experimental manifests at Translate commit `0fa82c7`. Their hashes belong to
the retained scene and term reports. They are evidence inputs, not current
profiles for new runs. New experimental manifests use the typed-provider code
identity documented in the [retry regression](../experiments/2026-09-28-typed-provider-retry.md).

The site verifies historical reports against these snapshots and separately
checks that the current manifests have a different identity. Preserve both when
changing prompt or provider code; never rewrite a measured report to match a
new profile.
