<!--
Thanks for contributing to Revamp-IT! Please skim the checklist below
before opening the PR. CI will catch most violations automatically,
but a clean PR description makes review much faster.
-->

## What & why

<!-- One paragraph: what does this change, and what user-visible
problem does it solve? Link any related issue. -->

## Approach

<!-- The interesting design decision in this PR. Skip if obvious. -->

## Screenshots / recordings

<!-- For UI changes: before/after, or a short clip. Mobile (375px)
matters as much as desktop. -->

## Checklist

- [ ] Tests pass locally (`npm test`)
- [ ] `npm run lint` clean
- [ ] `npm run typecheck` clean
- [ ] Swiss German: no ASCII umlauts (`npm run lint:umlauts`); proper `ä/ö/ü`, `ss` (not `ß`)
- [ ] No `console.log` — use `logger` from `@/lib/logger`
- [ ] No hardcoded table names — use `TABLE_NAMES` from `@/config/database`
- [ ] No hardcoded org data — use `@/config/org`
- [ ] Parameterized SQL queries only

## Notes for review

<!-- Anything you want a reviewer to look at twice, or any follow-ups
you're deferring. -->
