# Ralph Autonomous Task Prompt

## Current Task

<!-- Replace this with your specific task -->
[DESCRIBE YOUR TASK HERE]

## Context

- **Project**: RevampIT - Swiss Non-Profit Tech Platform
- **Tech Stack**: Next.js 16, Express CMS API, PostgreSQL, Docker
- **Key Docs**: See `.claude/CLAUDE.md` and `docs/SHARED_CONTEXT.md`

## Task Requirements

<!-- List specific requirements -->
1.
2.
3.

## Success Criteria

<!-- How do we know this is done? -->
- [ ] Type check passes (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)
- [ ] No console.log statements (use logger)
- [ ] Using TABLE_NAMES for database queries
- [ ] Build succeeds (`npm run build`)
- [ ] [Add specific criteria for this task]

## Constraints

- Use `logger` from `@/lib/logger` (no console.log)
- Use `TABLE_NAMES` from `@/config/database`
- Parameterized SQL queries only
- Swiss German for user-facing text ("ss" not "ß")
- Never delete migration files

## Completion Signal

When ALL success criteria are met, output exactly:

```
<promise>TASK_COMPLETE</promise>
```

## Current Progress

Check `@fix_plan.md` for task breakdown and progress tracking.

---

**Note**: This prompt is designed for Ralph autonomous loops. Edit the task description above before running.
