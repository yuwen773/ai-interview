# Weapp Homepage Density Reduction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the mini-program homepage by removing the quick-entry card section while preserving recent-status visibility.

**Architecture:** This change is limited to the homepage page component and its stylesheet. The JSX tree loses the quick-entry block, and related dead code and styles are deleted so layout hierarchy stays clear.

**Tech Stack:** Taro, React, TypeScript, SCSS

---

### Task 1: Remove quick-entry homepage block

**Files:**
- Modify: `uniapp-interview/src/pages/index/index.tsx`
- Modify: `uniapp-interview/src/pages/index/index.scss`

- [ ] **Step 1: Confirm the current homepage sections and quick-entry dependencies**

Check `uniapp-interview/src/pages/index/index.tsx` for the quick-entry type, data array, section markup, and any navigation handlers used only by that section.

- [ ] **Step 2: Remove the quick-entry section from the page component**

Delete the quick-entry type, data array, and JSX block, while keeping the hero, primary task, and recent-status sections unchanged.

- [ ] **Step 3: Remove dead styles tied to the quick-entry layout**

Delete SCSS rules for the quick-entry section, list, cards, title, and CTA so the stylesheet matches the rendered structure.

- [ ] **Step 4: Build the mini-program target**

Run: `pnpm build:weapp`

Expected: successful build without homepage compile errors.
