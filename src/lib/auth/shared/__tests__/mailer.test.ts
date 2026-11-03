/**
 * evig's account mail on AccountKit's shared mailer: its own 6-digit
 * confirmation stays the mail for `verify` (the shared confirmation link only
 * when the code cannot be sent), and the sign-in link's email carries
 * AccountKit's sign-in code.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

const sendConfirmationCode = vi.fn<(email: string) => Promise<boolean>>();
vi.mock('../confirmation-code', () => ({ sendConfirmationCode }));
vi.mock('@/db', () => ({ db: {} }));
vi.mock('../accounts', () => ({ ensureEvigUser: vi.fn() }));
vi.mock('../evig-plugin', () => ({ evigPlugin: () => ({ id: 'evig-test' }) }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  sendConfirmationCode.mockReset();
});

describe('evig account mail', () => {
  test("confirmation is evig's own code mail, with the shared link as the fallback", async () => {
    vi.stubEnv('RESEND_API_KEY', 're_unit_test_not_a_key');
    const fetchMock = vi.fn(async () => Response.json({ id: 'm' }));
    vi.stubGlobal('fetch', fetchMock);
    const { sharedAuthMailer } = await import('../runtime');
    const { PUBLIC_SITE_URL } = await import('@/config/urls');
    const link = `${PUBLIC_SITE_URL}/api/auth/verify-email?token=t`;

    sendConfirmationCode.mockResolvedValueOnce(true);
    await sharedAuthMailer.send('verify', 'person@example.ch', link);
    expect(sendConfirmationCode).toHaveBeenCalledWith('person@example.ch');
    expect(fetchMock).not.toHaveBeenCalled();

    sendConfirmationCode.mockResolvedValueOnce(false);
    await sharedAuthMailer.send('verify', 'person@example.ch', link);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("the sign-in link's email carries AccountKit's sign-in code", async () => {
    vi.stubEnv('RESEND_API_KEY', 're_unit_test_not_a_key');
    const fetchMock = vi.fn(async () => Response.json({ id: 'm' }));
    vi.stubGlobal('fetch', fetchMock);
    const { sharedAuthMailer } = await import('../runtime');
    const { PUBLIC_SITE_URL } = await import('@/config/urls');
    expect(sharedAuthMailer.codes).toBe(true);
    await sharedAuthMailer.send(
      'magicLink',
      'person@example.ch',
      `${PUBLIC_SITE_URL}/api/auth/magic-link/verify?token=t`,
      { code: '123456' },
    );
    const init = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(init[1].body));
    expect(body.text).toContain('123 456');
    expect(sendConfirmationCode).not.toHaveBeenCalled();
  });
});
