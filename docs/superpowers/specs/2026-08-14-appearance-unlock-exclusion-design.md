# Appearance-unlock exclusion design

## Goal

Prevent cosmetic unlock tokens from appearing as usable equipment in the Midnight S2 equipment browser and build flow.

## Rule

A record is excluded when one of its parsed `use` effects says that using the item adds its appearance to the Warband collection. The current verified IDs are 258045, 275937, and 281227. The semantic tooltip rule is the primary safeguard; the ID list is retained as an audit assertion so a future localization or parser regression cannot silently reintroduce these records.

## Data flow

The exclusion is applied by the S2 local-data generation pipeline before the generated class JSON files are copied into the Mini Program class subpackages. It is therefore absent from both the reviewable `cos-upload/data-12.1-s2-crafted-preview` data and the runtime `miniprogram/packages/class-*/data` modules. No presentation-only hiding is used.

## Validation

The generator reports excluded IDs and record counts. The verification scans all 13 class files in both locations, confirms that none of the three IDs remain, and checks that the visible record count changes only by their 38 duplicated class records.
