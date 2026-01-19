# Ralph Autonomous Loop - RevampIT

Run Claude Code in autonomous loops to complete tasks without manual intervention.

## Quick Start

```bash
# 1. Edit PROMPT.md with your task
nano PROMPT.md

# 2. Add tasks to @fix_plan.md
nano @fix_plan.md

# 3. Run Ralph
./ralph.sh
```

## Configuration (Conservative for Limited Plans)

Default settings are conservative to work with limited Claude subscriptions:

| Setting | Default | Purpose |
|---------|---------|---------|
| Max iterations | 10 | Safety limit |
| Sleep between | 60s | Prevent rate limits |
| Prompt file | PROMPT.md | Task description |

### Custom Settings

```bash
# Fewer iterations (very conservative)
./ralph.sh --max 5

# More iterations (if you have quota)
./ralph.sh --max 20

# Custom prompt file
./ralph.sh --prompt my-task.md

# Longer sleep between iterations
./ralph.sh --sleep 120
```

## Files

| File | Purpose |
|------|---------|
| `PROMPT.md` | Task description - edit this for each task |
| `@fix_plan.md` | Priority queue - Claude focuses on P0/P1 first |
| `ralph.sh` | The loop script |
| `RALPH.md` | This file |

## RevampIT-Specific Reminders

When running Ralph on RevampIT, ensure tasks include:

- **Use logger**: No `console.log`, use `logger` from `@/lib/logger`
- **Use TABLE_NAMES**: No hardcoded table names
- **Parameterized queries**: No string concatenation in SQL
- **Swiss German**: Use "ss" not "ß" for user-facing text

## Workflow

1. **Define Task**: Edit `PROMPT.md` with clear requirements
2. **Set Priorities**: Update `@fix_plan.md` with specific subtasks
3. **Run Loop**: `./ralph.sh`
4. **Monitor**: Watch output, Ctrl+C to stop anytime
5. **Review**: Check changes with `git diff`

## Best Practices for Limited Plans

1. **Run during active hours**: Don't let it run overnight
2. **Use 5-10 iterations**: Start small, increase if needed
3. **Clear success criteria**: Help Claude know when done
4. **Focused tasks**: One feature at a time
5. **Check rate limits**: Script auto-detects and waits

## Stopping

- **Ctrl+C**: Stop immediately
- **Max iterations**: Stops automatically
- **Completion signal**: Stops when Claude outputs `<promise>TASK_COMPLETE</promise>`

## Example Task

```markdown
# In PROMPT.md

## Current Task
Add appointment booking feature to CMS API

## Success Criteria
- [ ] API endpoint created at /api/appointments
- [ ] Using TABLE_NAMES.APPOINTMENTS
- [ ] Using logger for all logging
- [ ] Parameterized SQL queries
- [ ] Type check passes
- [ ] Lint passes

When ALL criteria met, output:
<promise>TASK_COMPLETE</promise>
```

## Troubleshooting

**"Prompt file not found"**
- Create PROMPT.md first

**"Rate limit detected"**
- Normal for limited plans
- Script waits automatically

**Task not completing**
- Add clearer success criteria
- Break into smaller subtasks
- Check @fix_plan.md priorities

**Console.log errors**
- Replace with `logger.info()`, `logger.error()`, etc.
