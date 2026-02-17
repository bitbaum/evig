import { parseActionEnvelope, stripActionBlock } from '../action-cockpit'

describe('hirn action cockpit parser', () => {
  it('extracts valid actions from fenced block', () => {
    const input = `Hier isch mini Antwort\n\n\`\`\`hirn-actions
{"version":"1.0","actions":[{"id":"a1","type":"create_task","title":"Task","summary":"Kurz","cta":"Erstelle","risky":false,"payload":{"title":"X","task_type":"one_time","category":"admin","priority":"normal"}}]}
\`\`\``

    const parsed = parseActionEnvelope(input)

    expect(parsed.parsingError).toBeUndefined()
    expect(parsed.actions).toHaveLength(1)
    expect(parsed.actions[0].type).toBe('create_task')
    expect(stripActionBlock(input)).toBe('Hier isch mini Antwort')
  })

  it('rejects malformed schema safely', () => {
    const input = `Text\n\n\`\`\`hirn-actions
{"version":"1.0","actions":[{"id":"a1","type":"nope"}]}
\`\`\``

    const parsed = parseActionEnvelope(input)

    expect(parsed.actions).toHaveLength(0)
    expect(parsed.parsingError).toBeDefined()
  })
})
