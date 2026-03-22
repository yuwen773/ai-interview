# Weapp Homepage Density Reduction Design

## Goal

Reduce the visual density of the mini-program homepage by keeping the "最近状态" section and removing the large-card "快捷入口" section.

## Decision

The homepage should prioritize closed-loop progress recovery over feature distribution.

Keep:

1. Hero summary
2. Primary task card
3. Recent status section

Remove:

1. Quick entry large-card section

## Rationale

1. The homepage already contains a clear primary task and a recent-status summary.
2. The quick-entry cards duplicate navigation value that already exists in the tab bar and primary actions.
3. The current status grid and quick-entry grid have similar visual weight, which makes the page feel crowded and weakens the main task hierarchy.

## Scope

Only the mini-program homepage in `uniapp-interview/src/pages/index/` changes.

## Validation

1. The homepage still renders hero, primary task, and recent status sections.
2. The quick-entry section no longer appears.
3. The page builds successfully for the weapp target.
