/**
 * The OpenRouter default must be a FREE model.
 *
 * Pinned as a test because the failure is silent and only shows up on a bill.
 * The previous default, `meta-llama/llama-3.3-70b-instruct`, reads as a free
 * community model and is not one: OpenRouter's own catalogue reports
 * `pricing.prompt = 0.0000001` for it (checked 2026-08-16), and the `:free`
 * sibling people remember has been retired — so every Hirn chat answered by
 * OpenRouter was charged.
 *
 * The rule mirrors `modelCost` in the shared `ai-ration` package: a routed id
 * (`vendor/model`) is free only with the `:free` suffix. That suffix is the
 * whole difference between free routing and a per-call charge for identical
 * weights, which is why an id one token away from correct went unnoticed.
 *
 * Free catalogues rot. When this id dies, replace it with another `:free` one —
 * never by dropping the suffix, which is how it broke the first time.
 */
import { OpenRouterProvider } from '../providers/openrouter';

describe('OpenRouter default model', () => {
  const originalEnv = process.env.OPENROUTER_MODEL;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.OPENROUTER_MODEL;
    else process.env.OPENROUTER_MODEL = originalEnv;
  });

  it('is a :free id, so the default never bills', () => {
    const provider = new OpenRouterProvider({ apiKey: 'test-key' });
    expect(provider.getDefaultModel()).toMatch(/:free$/);
  });

  it('is never an Anthropic model', () => {
    // Standing fleet rule: Anthropic is paid and is not a default or fallback.
    const provider = new OpenRouterProvider({ apiKey: 'test-key' });
    expect(provider.getDefaultModel()).not.toMatch(/anthropic/i);
  });
});
