'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api/client';
import { useSwrFetch } from '@/lib/api/swr';
import { logger } from '@/lib/logger';
import { redirect } from 'next/navigation';

export interface Review {
  id: string;
  targetType: string;
  targetId: string;
  targetName: string;
  overallRating: number;
  ratings: {
    communication?: number;
    professionalism?: number;
    quality?: number;
    timeliness?: number;
    value?: number;
  };
  title?: string;
  content: string;
  status: string;
  helpfulVotes: number;
  totalVotes: number;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
  response?: {
    content: string;
    responderName: string;
    createdAt: string;
  };
}

export interface UserVote {
  reviewId: string;
  voteType: 'helpful' | 'unhelpful';
}

export interface EditForm {
  overallRating: number;
  communicationRating: number;
  professionalismRating: number;
  qualityRating: number;
  timelinessRating: number;
  valueRating: number;
  title: string;
  content: string;
}

const DEFAULT_EDIT_FORM: EditForm = {
  overallRating: 5,
  communicationRating: 5,
  professionalismRating: 5,
  qualityRating: 5,
  timelinessRating: 5,
  valueRating: 5,
  title: '',
  content: '',
};

export function useReviewManagement(authStatus: string) {
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>(DEFAULT_EDIT_FORM);

  // Fetch is gated on an authenticated session via the null SWR key.
  const {
    data,
    error: loadError,
    isLoading: loading,
    mutate,
  } = useSwrFetch<{
    reviews: Review[];
  }>(authStatus === 'authenticated' ? '/api/user/reviews' : null);
  const reviews = data?.reviews ?? [];
  const error = loadError
    ? loadError instanceof Error && loadError.message
      ? loadError.message
      : 'Unknown error'
    : null;

  const fetchUserReviews = async () => {
    await mutate();
  };

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      redirect('/auth/login');
    }
  }, [authStatus]);

  const handleEditReview = (review: Review) => {
    setEditingReview(review.id);
    setEditForm({
      overallRating: review.overallRating,
      communicationRating: review.ratings.communication || 5,
      professionalismRating: review.ratings.professionalism || 5,
      qualityRating: review.ratings.quality || 5,
      timelinessRating: review.ratings.timeliness || 5,
      valueRating: review.ratings.value || 5,
      title: review.title || '',
      content: review.content,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;

    try {
      const result = await apiFetch<void>(`/api/reviews/${editingReview}`, {
        method: 'PUT',
        body: editForm,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update review');
      }

      await fetchUserReviews();
      setEditingReview(null);
      toast.success('Bewertung erfolgreich aktualisiert!');
    } catch (err) {
      logger.warn('Failed to update review', { error: err, reviewId: editingReview });
      toast.error(
        'Fehler beim Aktualisieren der Bewertung: ' +
          (err instanceof Error ? err.message : 'Unknown error'),
      );
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (
      !confirm(
        'Bist du sicher, dass du diese Bewertung löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.',
      )
    ) {
      return;
    }

    try {
      const result = await apiFetch<void>(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete review');
      }

      await fetchUserReviews();
      toast.success('Bewertung erfolgreich gelöscht!');
    } catch (err) {
      logger.warn('Failed to delete review', { error: err, reviewId });
      toast.error(
        'Fehler beim Löschen der Bewertung: ' +
          (err instanceof Error ? err.message : 'Unknown error'),
      );
    }
  };

  const handleVote = async (reviewId: string, voteType: 'helpful' | 'unhelpful') => {
    try {
      const result = await apiFetch<{ action: string }>(`/api/reviews/${reviewId}/vote`, {
        method: 'POST',
        body: { voteType },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to vote on review');
      }

      const action = result.data!.action;

      // Patch the cached payload locally — the server already recorded the vote.
      mutate(
        (current) =>
          current && {
            reviews: current.reviews.map((review) =>
              review.id === reviewId
                ? {
                    ...review,
                    helpfulVotes:
                      voteType === 'helpful'
                        ? action === 'added'
                          ? review.helpfulVotes + 1
                          : review.helpfulVotes - 1
                        : review.helpfulVotes,
                    totalVotes: action === 'added' ? review.totalVotes + 1 : review.totalVotes - 1,
                  }
                : review,
            ),
          },
        { revalidate: false },
      );

      if (action === 'added') {
        setUserVotes([...userVotes.filter((v) => v.reviewId !== reviewId), { reviewId, voteType }]);
      } else if (action === 'removed') {
        setUserVotes(userVotes.filter((v) => v.reviewId !== reviewId));
      }
    } catch (err) {
      logger.error('Vote error', { error: err, reviewId, voteType });
      toast.error(
        'Fehler bei der Abstimmung: ' + (err instanceof Error ? err.message : 'Unknown error'),
      );
    }
  };

  const cancelEdit = () => setEditingReview(null);

  const getUserVoteForReview = (reviewId: string) => {
    return userVotes.find((vote) => vote.reviewId === reviewId)?.voteType;
  };

  const canEditReview = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const daysSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation <= 30;
  };

  return {
    // State
    reviews,
    loading,
    error,
    editingReview,
    editForm,
    setEditForm,
    // Actions
    handleEditReview,
    handleSaveEdit,
    handleDeleteReview,
    handleVote,
    cancelEdit,
    // Helpers
    getUserVoteForReview,
    canEditReview,
  };
}
