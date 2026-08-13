# S2 Local Crafted Preview Design

## Goal

Make the WeChat mini-program load an isolated Midnight S2 preview dataset from the workspace, while preserving the existing COS dataset and the existing crafted-stat selection behavior.

## Data flow

`cos-upload/data-12.1-s2-crafted-preview` is the editable and reviewable source directory. A small generated module under `miniprogram/local-data` exposes the same class and overview payloads to the local mini-program. A local-preview flag selects that module before any COS request is made.

## Crafted equipment

Crafted records use the established model: fixed secondary stats remain in `stats.secondary`; selectable secondary stats remain only in `crafting.randomAttributeSlots`. The existing picker resolves selected stats when an item is added to a build. Candidate-only records remain excluded from the visible equipment list until their S2 highest-level profile and tooltip values are verified.

## Safety and validation

The preview directory is new and never replaces `data-4.4.x`. Its overview reports `releaseStatus`, `equipmentVariant`, and crafted verification counters. Tests verify that the local loader does not make a COS request in preview mode and that preview crafted data cannot contain selectable random stats inside `stats.secondary`.
