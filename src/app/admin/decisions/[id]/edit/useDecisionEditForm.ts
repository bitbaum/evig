'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  METHODS_REQUIRING_OPTIONS,
  DOT_VOTING_DEFAULTS,
  type DecisionType,
  type VotingMethod,
} from '@/config/decisions';
import { type OptionItem } from '../../new/useDecisionForm';

interface DecisionData {
  id: string;
  title: string;
  description: string;
  background: string | null;
  decisionType: DecisionType;
  votingMethod: VotingMethod;
  options: OptionItem[];
  quorum: { type: 'percentage' | 'absolute'; value: number };
  blindVoting: boolean;
  dotCount: number | null;
  allowPublicVoting: boolean;
  status: string;
}

export function useDecisionEditForm(decisionId: string) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [decisionType, setDecisionType] = useState<DecisionType>('sense_check');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [background, setBackground] = useState('');
  const [votingMethod, setVotingMethod] = useState<VotingMethod>('simple_majority');
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [showImageUrls, setShowImageUrls] = useState(false);
  const [blindVoting, setBlindVoting] = useState(true);
  const [allowPublicVoting, setAllowPublicVoting] = useState(false);
  const [dotCount, setDotCount] = useState(DOT_VOTING_DEFAULTS.default);
  const [quorumType, setQuorumType] = useState<'percentage' | 'absolute'>('percentage');
  const [quorumValue, setQuorumValue] = useState(50);

  useEffect(() => {
    apiFetch<DecisionData>(`/api/decisions/${decisionId}`).then((result) => {
      if (result.success && result.data) {
        const d = result.data;
        setDecisionType(d.decisionType);
        setTitle(d.title);
        setDescription(d.description);
        setBackground(d.background ?? '');
        setVotingMethod(d.votingMethod);
        const loadedOptions: OptionItem[] = d.options.length > 0
          ? d.options.map((o) => ({ id: o.id, label: o.label, description: o.description || '', imageUrl: o.imageUrl || '' }))
          : [
              { id: crypto.randomUUID(), label: '', description: '', imageUrl: '' },
              { id: crypto.randomUUID(), label: '', description: '', imageUrl: '' },
            ];
        setOptions(loadedOptions);
        if (loadedOptions.some((o) => o.imageUrl)) setShowImageUrls(true);
        setBlindVoting(d.blindVoting);
        setAllowPublicVoting(d.allowPublicVoting ?? false);
        setDotCount(d.dotCount || DOT_VOTING_DEFAULTS.default);
        setQuorumType(d.quorum.type);
        setQuorumValue(d.quorum.value);
      }
      setLoading(false);
    });
  }, [decisionId]);

  function addOption() {
    setOptions((prev) => [...prev, { id: crypto.randomUUID(), label: '', description: '', imageUrl: '' }]);
  }
  function removeOption(id: string) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }
  function updateOption(id: string, field: 'label' | 'description' | 'imageUrl', value: string) {
    setOptions((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  }

  const needsOptions = METHODS_REQUIRING_OPTIONS.includes(votingMethod);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await apiFetch<unknown>(`/api/decisions/${decisionId}`, {
      method: 'PATCH',
      body: {
        title, description,
        background: background.trim() || null,
        decisionType, votingMethod,
        options: needsOptions
          ? options.filter((o) => o.label.trim()).map((o) => ({ ...o, imageUrl: o.imageUrl.trim() || undefined }))
          : [],
        quorum: { type: quorumType, value: quorumValue },
        blindVoting, allowPublicVoting,
        dotCount: votingMethod === 'dot' ? dotCount : null,
      },
    });

    if (!result.success) {
      setError((result as { error?: string }).error || 'Fehler beim Speichern');
      setSubmitting(false);
      return;
    }

    router.push(`/admin/decisions/${decisionId}`);
  }

  return {
    loading, submitting, error,
    showAdvanced, setShowAdvanced,
    decisionType, setDecisionType,
    title, setTitle,
    description, setDescription,
    background, setBackground,
    votingMethod, setVotingMethod,
    options, showImageUrls, setShowImageUrls,
    blindVoting, setBlindVoting,
    allowPublicVoting, setAllowPublicVoting,
    dotCount, setDotCount,
    quorumType, setQuorumType,
    quorumValue, setQuorumValue,
    needsOptions,
    addOption, removeOption, updateOption,
    handleSubmit,
  };
}
