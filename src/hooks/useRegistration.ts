'use client';

import { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api/client';

interface UseRegistrationResult {
  verifyError: string | undefined;
  verifyCode: (email: string, code: string) => Promise<boolean>;
  resendCode: (email: string) => Promise<boolean>;
}

/** evig's 6-digit address confirmation: check a code, send a new one. */
export function useRegistration(): UseRegistrationResult {
  const [verifyError, setVerifyError] = useState<string | undefined>();

  const verifyCode = useCallback(async (email: string, code: string): Promise<boolean> => {
    setVerifyError(undefined);

    const result = await apiFetch<unknown>('/api/auth/verify-code', {
      method: 'POST',
      body: { email, code },
    });

    if (!result.success) {
      setVerifyError(result.error || 'Ungültiger Code');
      return false;
    }

    return true;
  }, []);

  const resendCode = useCallback(async (email: string): Promise<boolean> => {
    const result = await apiFetch<unknown>('/api/auth/resend-code', {
      method: 'POST',
      body: { email },
    });

    return result.success;
  }, []);

  return {
    verifyError,
    verifyCode,
    resendCode,
  };
}
