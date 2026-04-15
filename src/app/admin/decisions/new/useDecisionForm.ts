'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DECISION_TYPE_DEFAULTS,
  VOTING_METHODS,
  DECISION_TYPES,
  METHODS_REQUIRING_OPTIONS,
  DOT_VOTING_DEFAULTS,
  DECISION_CATEGORIES,
  CATEGORY_SCOPE_DEFAULTS,
  PARTICIPANT_SCOPES,
  type DecisionType,
  type VotingMethod,
  type DecisionCategory,
  type ParticipantScope,
  type DecisionTemplate,
} from '@/config/decisions';

export interface OptionItem {
  id: string;
  label: string;
  description: string;
  imageUrl: string;
}

export interface TeamMember {
  id: string;
  name: string | null;
  email: string;
}

export function useDecisionForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [aiRecommendationReason, setAiRecommendationReason] = useState('');

  // Core form state
  const [decisionType, setDecisionType] = useState<DecisionType>('sense_check');
  const [participantScope, setParticipantScope] = useState<ParticipantScope>('all_staff');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [background, setBackground] = useState('');
  const [category, setCategory] = useState<DecisionCategory>('operativ');
  const [votingMethod, setVotingMethod] = useState<VotingMethod>(
    DECISION_TYPE_DEFAULTS.sense_check.votingMethod
  );
  const [options, setOptions] = useState<OptionItem[]>([
    { id: crypto.randomUUID(), label: '', description: '', imageUrl: '' },
    { id: crypto.randomUUID(), label: '', description: '', imageUrl: '' },
  ]);
  const [showImageUrls, setShowImageUrls] = useState(false);
  const [blindVoting, setBlindVoting] = useState(true);
  const [dotCount, setDotCount] = useState(DOT_VOTING_DEFAULTS.default);
  const [quorumType, setQuorumType] = useState<'percentage' | 'absolute'>('percentage');
  const [quorumValue, setQuorumValue] = useState(50);
  const [discussionDeadline, setDiscussionDeadline] = useState('');
  const [votingDeadline, setVotingDeadline] = useState('');
  const initialStatusRef = useRef<'draft' | 'discussion' | 'voting'>('draft');
  const setInitialStatus = (status: 'draft' | 'discussion' | 'voting') => {
    initialStatusRef.current = status;
  };

  // Participant state
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<Set<string>>(new Set());
  const [participantSearch, setParticipantSearch] = useState('');

  useEffect(() => {
    // Fetch team members (staff) and Verein members — needed for 'invited' scope.
    Promise.all([
      fetch('/api/admin/team/profiles').then((res) => res.json()).catch(() => null),
      fetch('/api/admin/membership/members').then((res) => res.json()).catch(() => null),
    ]).then(([teamJson, memberJson]) => {
      const teamList: TeamMember[] = teamJson?.success && Array.isArray(teamJson.data)
        ? teamJson.data.map((m: { userId: string; name: string | null; email: string }) => ({
            id: m.userId, name: m.name, email: m.email,
          }))
        : [];

      const memberList: TeamMember[] = memberJson?.success && Array.isArray(memberJson.data)
        ? memberJson.data.map((m: { id: string; name: string | null; email: string }) => ({
            id: m.id, name: m.name, email: m.email,
          }))
        : [];

      const byId = new Map<string, TeamMember>();
      for (const p of [...teamList, ...memberList]) byId.set(p.id, p);
      setTeamMembers(Array.from(byId.values()));
    });
  }, []);

  const filteredMembers = teamMembers.filter((m) => {
    if (!participantSearch) return true;
    const q = participantSearch.toLowerCase();
    return m.email.toLowerCase().includes(q) || (m.name && m.name.toLowerCase().includes(q));
  });

  function handleTypeChange(type: DecisionType) {
    setDecisionType(type);
    const defaults = DECISION_TYPE_DEFAULTS[type];
    setVotingMethod(defaults.votingMethod);
    setBlindVoting(defaults.blindVoting);
    setQuorumType(defaults.quorum.type);
    setQuorumValue(defaults.quorum.value);
  }

  function handleTemplateSelect(template: DecisionTemplate) {
    setDecisionType(template.decisionType);
    setVotingMethod(template.votingMethod);
    setCategory(template.category);
    setParticipantScope(template.participantScope);
    setQuorumType(template.quorum.type);
    setQuorumValue(template.quorum.value);
    setBlindVoting(DECISION_TYPE_DEFAULTS[template.decisionType].blindVoting);
    if (template.sampleOptions && template.sampleOptions.length > 0) {
      setOptions(template.sampleOptions.map((o) => ({
        id: crypto.randomUUID(), label: o.label, description: o.description || '', imageUrl: '',
      })));
    }
  }

  function handleAIFieldsFilled(data: Partial<Record<string, unknown>>) {
    if (data.title) setTitle(String(data.title));
    if (data.description) setDescription(String(data.description));
    if (data.background) setBackground(String(data.background));
    if (Array.isArray(data.options)) {
      setOptions(data.options.map((opt: unknown) => {
        const o = opt as Record<string, string>;
        return { id: crypto.randomUUID(), label: o.label || '', description: o.description || '', imageUrl: o.imageUrl || '' };
      }));
    }
    if (data.recommendedDecisionType) {
      const t = data.recommendedDecisionType as DecisionType;
      if (DECISION_TYPES.includes(t)) handleTypeChange(t);
    }
    if (data.recommendedVotingMethod) {
      const m = data.recommendedVotingMethod as VotingMethod;
      if (VOTING_METHODS.includes(m)) setVotingMethod(m);
    }
    if (data.recommendedCategory) {
      const cat = data.recommendedCategory as DecisionCategory;
      if (Object.values(DECISION_CATEGORIES).includes(cat)) {
        setCategory(cat);
        setParticipantScope(CATEGORY_SCOPE_DEFAULTS[cat]);
      }
    }
    if (data.recommendedParticipantScope) {
      const scope = data.recommendedParticipantScope as ParticipantScope;
      if (PARTICIPANT_SCOPES.includes(scope)) setParticipantScope(scope);
    }
    if (data.recommendedQuorum && typeof data.recommendedQuorum === 'object') {
      const q = data.recommendedQuorum as { type?: string; value?: number };
      if (q.type === 'percentage' || q.type === 'absolute') setQuorumType(q.type);
      if (typeof q.value === 'number') setQuorumValue(q.value);
    }
    if (data.recommendationReason) setAiRecommendationReason(String(data.recommendationReason));
  }

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

  function toggleParticipant(id: string) {
    setSelectedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const needsOptions = METHODS_REQUIRING_OPTIONS.includes(votingMethod);
    const payload = {
      title, description,
      background: background.trim() || null,
      category, decisionType, votingMethod,
      options: needsOptions
        ? options.filter((o) => o.label.trim()).map((o) => ({ ...o, imageUrl: o.imageUrl.trim() || undefined }))
        : [],
      quorum: { type: quorumType, value: quorumValue },
      blindVoting,
      dotCount: votingMethod === 'dot' ? dotCount : null,
      participantScope,
      invitedParticipants: participantScope === 'invited' ? Array.from(selectedParticipants) : [],
      discussionDeadline: discussionDeadline ? new Date(discussionDeadline).toISOString() : null,
      votingDeadline: votingDeadline ? new Date(votingDeadline).toISOString() : null,
      initialStatus: initialStatusRef.current,
    };

    try {
      const res = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || 'Fehler beim Erstellen');
        setSubmitting(false);
        return;
      }
      router.push(`/admin/decisions/${json.data.id}`);
    } catch {
      setError('Netzwerkfehler');
      setSubmitting(false);
    }
  }

  return {
    // Submit state
    submitting, error,
    handleSubmit,
    setInitialStatus,
    // AI
    aiRecommendationReason,
    setAiRecommendationReason,
    handleAIFieldsFilled,
    // Decision type
    decisionType, handleTypeChange,
    // Core fields
    title, setTitle,
    description, setDescription,
    background, setBackground,
    category, setCategory,
    // Options
    options, showImageUrls, setShowImageUrls,
    addOption, removeOption, updateOption,
    needsOptions: METHODS_REQUIRING_OPTIONS.includes(votingMethod),
    // Deadlines
    discussionDeadline, setDiscussionDeadline,
    votingDeadline, setVotingDeadline,
    // Participant scope
    participantScope, setParticipantScope,
    teamMembers, selectedParticipants, toggleParticipant,
    participantSearch, setParticipantSearch,
    filteredMembers,
    // Advanced
    votingMethod, setVotingMethod,
    dotCount, setDotCount,
    quorumType, setQuorumType,
    quorumValue, setQuorumValue,
    blindVoting, setBlindVoting,
    // Template
    handleTemplateSelect,
  };
}
