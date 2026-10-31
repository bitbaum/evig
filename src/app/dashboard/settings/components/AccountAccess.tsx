'use client';

import { useEffect, useState } from 'react';
import { Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Heading from '@/components/ui/Heading';
import { Input } from '@/components/ui/input';
import { SETTINGS_CONFIG } from '@/config/profile';

interface PendingRequest {
  id: string;
  reason: string;
  createdAt: string | null;
  user: { id: string; email: string; name: string | null };
}

interface Mine {
  id: string;
  status: string;
  reason: string;
  createdAt: string | null;
}

interface AccountAccessProps {
  email: string;
  isSuperAdmin: boolean;
  emailVerified: boolean;
}

async function postJson<T>(
  url: string,
  body: unknown,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await response.json()) as { success?: boolean; data?: T; error?: string };
  if (!response.ok || !json.success) {
    return { ok: false, error: json.error || 'Etwas ist schiefgelaufen' };
  }
  return { ok: true, data: json.data };
}

export function AccountAccess({ email, isSuperAdmin, emailVerified }: AccountAccessProps) {
  const labels = SETTINGS_CONFIG.labels.account;
  const [currentEmail, setCurrentEmail] = useState(email);
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [code, setCode] = useState('');
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [mine, setMine] = useState<Mine | null>(null);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [canReview, setCanReview] = useState(isSuperAdmin);
  const [reason, setReason] = useState('');
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accessBusy, setAccessBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/account/admin-access')
      .then((response) => response.json())
      .then(
        (json: {
          success?: boolean;
          data?: { mine: Mine | null; canReview: boolean; pending: PendingRequest[] };
        }) => {
          if (cancelled || !json.success || !json.data) return;
          setMine(json.data.mine);
          setCanReview(json.data.canReview);
          setPending(json.data.pending);
        },
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function sendCode() {
    setEmailBusy(true);
    setEmailError(null);
    setEmailMessage(null);
    const result = await postJson<{ email: string }>('/api/account/email', {
      newEmail,
      currentPassword: emailPassword,
    });
    setEmailBusy(false);
    if (!result.ok) {
      setEmailError(result.error || null);
      return;
    }
    setCodeSentTo(result.data?.email || newEmail);
    setEmailMessage(labels.emailChangeSent);
  }

  async function confirmCode() {
    setEmailBusy(true);
    setEmailError(null);
    const result = await postJson<{ email: string }>('/api/account/email/confirm', { code });
    setEmailBusy(false);
    if (!result.ok) {
      setEmailError(result.error || null);
      return;
    }
    setCurrentEmail(result.data?.email || newEmail);
    setChangingEmail(false);
    setCodeSentTo(null);
    setCode('');
    setNewEmail('');
    setEmailPassword('');
    setEmailMessage(labels.emailChangeDone);
  }

  async function savePassword() {
    setPasswordBusy(true);
    setPasswordError(null);
    setPasswordMessage(null);
    const result = await postJson('/api/account/password', { currentPassword, newPassword });
    setPasswordBusy(false);
    if (!result.ok) {
      setPasswordError(result.error || null);
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setPasswordMessage(labels.passwordDone);
  }

  async function askAccess() {
    setAccessBusy(true);
    setAccessError(null);
    const result = await postJson<{ id: string; status: string }>('/api/account/admin-access', {
      reason,
    });
    setAccessBusy(false);
    if (!result.ok) {
      setAccessError(result.error || null);
      return;
    }
    setMine({ id: result.data?.id || '', status: 'pending', reason, createdAt: null });
    setReason('');
    setAccessMessage(labels.adminAccessPending);
  }

  async function decide(id: string, action: 'approve' | 'reject', level?: 'admin' | 'staff') {
    setAccessBusy(true);
    setAccessError(null);
    const result = await postJson(`/api/account/admin-access/${id}`, { action, level });
    setAccessBusy(false);
    if (!result.ok) {
      setAccessError(result.error || null);
      return;
    }
    setPending((rows) => rows.filter((row) => row.id !== id));
    setAccessMessage(action === 'approve' ? labels.adminAccessApproved : labels.adminAccessReject);
  }

  return (
    <div className="space-y-8">
      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">{labels.email}</label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Mail className="h-5 w-5 text-text-muted" />
          </div>
          <Input type="email" value={currentEmail} readOnly className="pl-10" />
        </div>
        <p className="mt-2 text-sm text-text-tertiary">{labels.emailDescription}</p>
        {emailMessage && <p className="mt-2 text-sm text-action">{emailMessage}</p>}
        {emailError && <p className="mt-2 text-sm text-error-600">{emailError}</p>}

        {!changingEmail ? (
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={() => {
              setChangingEmail(true);
              setEmailError(null);
              setEmailMessage(null);
            }}
          >
            {labels.emailChange}
          </Button>
        ) : (
          <div className="mt-4 space-y-3 rounded-lg border border-subtle p-4">
            {!codeSentTo ? (
              <div className="space-y-3">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-text-secondary"
                    htmlFor="new_email"
                  >
                    {labels.emailChangeNew}
                  </label>
                  <Input
                    id="new_email"
                    type="email"
                    required
                    value={newEmail}
                    onChange={(event) => setNewEmail(event.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label
                    className="mb-2 block text-sm font-medium text-text-secondary"
                    htmlFor="email_password"
                  >
                    {labels.emailChangePassword}
                  </label>
                  <Input
                    id="email_password"
                    type="password"
                    required
                    value={emailPassword}
                    onChange={(event) => setEmailPassword(event.target.value)}
                    autoComplete="current-password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" disabled={emailBusy} onClick={() => void sendCode()}>
                    {labels.emailChangeSend}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setChangingEmail(false)}>
                    {labels.emailChangeCancel}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-text-secondary">
                  {labels.emailChangeSent} {codeSentTo}
                </p>
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder={labels.emailChangeCode}
                  required
                />
                <div className="flex gap-2">
                  <Button type="button" disabled={emailBusy} onClick={() => void confirmCode()}>
                    {labels.emailChangeConfirm}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setCodeSentTo(null)}>
                    {labels.emailChangeCancel}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 border-t-2 border pt-6">
        <Heading level={4} className="text-base font-semibold text-text-primary">
          {labels.password}
        </Heading>
        <p className="text-sm text-text-secondary">{labels.passwordDescription}</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label
              className="mb-2 block text-sm font-medium text-text-secondary"
              htmlFor="current_password"
            >
              {labels.currentPassword}
            </label>
            <Input
              id="current_password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div>
            <label
              className="mb-2 block text-sm font-medium text-text-secondary"
              htmlFor="new_password"
            >
              {labels.newPassword}
            </label>
            <Input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
        </div>
        {passwordMessage && <p className="text-sm text-action">{passwordMessage}</p>}
        {passwordError && <p className="text-sm text-error-600">{passwordError}</p>}
        <Button
          type="button"
          variant="outline"
          disabled={passwordBusy}
          onClick={() => void savePassword()}
        >
          {labels.passwordSave}
        </Button>
      </div>

      <div className="space-y-3 border-t-2 border pt-6">
        <Heading
          level={4}
          className="flex items-center gap-2 text-base font-semibold text-text-primary"
        >
          <ShieldCheck className="h-4 w-4" />
          {labels.adminAccess}
        </Heading>
        <p className="text-sm text-text-secondary">
          {canReview ? labels.adminAccessHave : labels.adminAccessNeed}
        </p>
        <p className="text-sm text-text-tertiary">{labels.adminAccessHint}</p>
        {accessMessage && <p className="text-sm text-action">{accessMessage}</p>}
        {accessError && <p className="text-sm text-error-600">{accessError}</p>}

        {canReview ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-text-secondary">{labels.adminAccessQueue}</p>
            {pending.length === 0 ? (
              <p className="text-sm text-text-tertiary">{labels.adminAccessEmpty}</p>
            ) : (
              pending.map((row) => (
                <div key={row.id} className="space-y-2 rounded-lg border border-subtle p-4">
                  <p className="text-sm font-medium text-text-primary">
                    {row.user.name || row.user.email}
                  </p>
                  <p className="text-sm text-text-tertiary">{row.user.email}</p>
                  <p className="text-sm text-text-secondary">{row.reason}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={accessBusy}
                      onClick={() => decide(row.id, 'approve', 'admin')}
                    >
                      {labels.adminAccessApprove}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={accessBusy}
                      onClick={() => decide(row.id, 'approve', 'staff')}
                    >
                      {labels.adminAccessStaff}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      disabled={accessBusy}
                      onClick={() => decide(row.id, 'reject')}
                    >
                      {labels.adminAccessReject}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : mine?.status === 'pending' ? (
          <p className="text-sm text-text-secondary">{labels.adminAccessPending}</p>
        ) : (
          <div className="space-y-3">
            {!emailVerified && (
              <p className="text-sm text-text-secondary">{labels.emailDescription}</p>
            )}
            {mine?.status === 'rejected' && (
              <p className="text-sm text-text-secondary">{labels.adminAccessRejected}</p>
            )}
            <label className="block text-sm font-medium text-text-secondary" htmlFor="admin_reason">
              {labels.adminAccessReason}
            </label>
            <textarea
              id="admin_reason"
              required
              minLength={8}
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-24 w-full rounded-md border border-subtle bg-surface-base px-3 py-2 text-sm text-text-primary"
            />
            <Button
              type="button"
              disabled={accessBusy || !emailVerified}
              onClick={() => void askAccess()}
            >
              {labels.adminAccessAsk}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
