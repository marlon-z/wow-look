# S2 Local Crafted Preview Design

## Goal

Make the WeChat mini-program load an isolated Midnight S2 preview dataset from the workspace, while preserving the existing COS dataset and the existing crafted-stat selection behavior.

## Data flow

`cos-upload/data-12.1-s2-crafted-preview` is the editable and reviewable source directory. During local verification, the mini-program requests this directory from a tiny HTTP server listening only on `127.0.0.1`; it does not call COS. This keeps the verification files identical to the later upload set and avoids embedding the full dataset in the mini-program package.

## Crafted equipment

Crafted records use the established model: fixed secondary stats remain in `stats.secondary`; selectable secondary stats remain only in `crafting.randomAttributeSlots`. The existing picker resolves selected stats when an item is added to a build. Candidate-only records remain excluded from the visible equipment list until their S2 highest-level profile and tooltip values are verified.

## Safety and validation

The preview directory is new and never replaces `data-4.4.x`. Its overview reports `releaseStatus`, `equipmentVariant`, and crafted verification counters. Tests verify that the local loader requests only `127.0.0.1` in preview mode and that preview crafted data cannot contain selectable random stats inside `stats.secondary`.
