'use client';

/**
 * The words on every chat in evig, translated once.
 *
 * Every chat is `@bitbaum/chatkit` (fleet rule); chatkit ships English labels
 * and takes overrides. This hook reads the `chat` message namespace and hands
 * back the two override objects, so each chat passes `labels={labels.thread}`
 * and `labels={labels.composer}` and none of them re-translates "Copy".
 */

import { useTranslations } from 'next-intl';
import type { ComposerLabelOverrides, ThreadLabels } from '@bitbaum/chatkit/react';

export interface ChatLabels {
  thread: Partial<ThreadLabels>;
  composer: ComposerLabelOverrides;
  /** One quiet line under the composer: answers can be wrong. */
  footnote: string;
}

export function useChatLabels(): ChatLabels {
  const t = useTranslations('chat');
  return {
    thread: {
      copy: t('copy'),
      copied: t('copied'),
      listen: t('listen'),
      share: t('share'),
      retry: t('retry'),
      stop: t('stop'),
      working: t('working'),
      stopped: t('stopped'),
      jump: t('jump'),
      failed: t('failed'),
      loading: t('loading'),
      replies: t('replies'),
    },
    composer: {
      send: t('send'),
      stop: t('stop'),
      voice: t('voice'),
      voiceStop: t('voiceStop'),
      cancelRecording: t('cancelRecording'),
      confirmRecording: t('confirmRecording'),
      listening: t('listening'),
      transcribing: t('transcribing'),
      queue: t('queue'),
      dismiss: t('dismiss'),
      retryTake: t('retryTake'),
      dictation: {
        mic: t('dictation.mic'),
        silence: t('dictation.silence'),
        unavailable: t('dictation.unavailable'),
        fileTooLarge: t('dictation.fileTooLarge'),
      },
    },
    footnote: t('footnote'),
  };
}
