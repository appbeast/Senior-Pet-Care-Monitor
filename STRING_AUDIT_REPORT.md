# Species Pathway String Audit & Governance Verification Report

- **Overall Audit Status:** PASS
- **Generated At:** 2026-11-14T10:16:22.929Z
- **Clinical Items Tagged & Verified:** 42
- **Forbidden Dog Words Audited in Cat Pathway (15 tokens):** `walk`, `walks`, `walking`, `leash`, `tail wag`, `wagging`, `bark`, `barking`, `howl`, `howling`, `dishaa`, `canine`, `yard`, `porch`, `dog`
- **Forbidden Cat Words Audited in Dog Pathway (12 tokens):** `litter box`, `litterbox`, `vishdaal`, `feline`, `meow`, `meowing`, `yowl`, `yowling`, `purr`, `windowsill`, `scratching post`, `cat`

## Audit Findings
| Scope | Status | Details |
|---|---|---|
| Clinical Review Metadata Governance | PASS | 42 clinical items/thresholds checked; 0 failures. |
| Cat Pathway Zero Dog-Word Audit | PASS | 358 cat pathway strings scanned against 15 dog tokens; 0 leaks. |
| Dog Pathway Zero Cat-Word Audit | PASS | 350 dog pathway strings scanned against 12 cat tokens; 0 leaks. |
| Correlation Non-Diagnostic Language & Vet Prompt | PASS | 3 active cat correlations verified to include vet-discussion framing and zero diagnostic claims. |
| QoL Unlogged Day Separation & Disclaimer | PASS | Empty 30-day history yields 0 good days, 30 unlogged days, and mandatory disclaimer. |

## Cat Pathway Leaks Found
- None (0 leaks detected).

## Dog Pathway Leaks Found
- None (0 leaks detected).
