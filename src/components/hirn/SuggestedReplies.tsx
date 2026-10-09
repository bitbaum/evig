'use client';

/**
 * The suggested replies under Hirn's latest answer — one tap sends it.
 *
 * Markup, behaviour and look are chatkit's `ChatReplies` (the fleet's one
 * reply row: 44px targets, wraps at 320px, a labelled group); evig supplies
 * only the translated label and its tokens (the --ck-* mapping in
 * globals.css). Callers pass the SAME send function their composer uses, so
 * a tap is indistinguishable from typing the reply and pressing Send.
 */

import '@bitbaum/chatkit/styles.css';
import { ChatReplies } from '@bitbaum/chatkit/react';
import { useTranslations } from 'next-intl';

export function SuggestedReplies({
  replies,
  onPick,
  disabled = false,
}: {
  replies: readonly string[] | undefined;
  onPick: (reply: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations('hirn');
  if (!replies || replies.length === 0) return null;
  return (
    <ChatReplies
      replies={replies}
      onPick={onPick}
      label={t('suggestedReplies')}
      disabled={disabled}
    />
  );
}
