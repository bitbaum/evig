import { packEmailChangeToken, unpackEmailChangeToken, isPlausibleEmail } from '../email-change';

describe('email change token', () => {
  it('round-trips a code and address', () => {
    const packed = packEmailChangeToken('123456', 'butai@gmail.com');
    expect(unpackEmailChangeToken(packed)).toEqual({
      code: '123456',
      newEmail: 'butai@gmail.com',
    });
  });

  it('rejects a token that is not a 6-digit code', () => {
    expect(unpackEmailChangeToken('12345:a@b.ch')).toBeNull();
    expect(unpackEmailChangeToken('abcdef:a@b.ch')).toBeNull();
  });

  it('rejects an address without a domain', () => {
    expect(isPlausibleEmail('not-an-email')).toBe(false);
    expect(isPlausibleEmail('butaeff@gmail.com')).toBe(true);
  });
});
