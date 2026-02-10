'use client';

import { useEffect, useState } from 'react';

interface ParticipationData {
  total: number;
  voted: { id: string; email: string }[];
  notVoted: { id: string; email: string }[];
  quorumTarget: number;
  quorumMet: boolean;
  progressPercent: number;
}

export default function ParticipationCard({
  decisionId,
}: {
  decisionId: string;
}) {
  const [data, setData] = useState<ParticipationData | null>(null);

  useEffect(() => {
    function fetchParticipation() {
      fetch(`/api/decisions/${decisionId}/votes/participation`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setData(json.data);
        });
    }
    fetchParticipation();
    const interval = setInterval(fetchParticipation, 30000);
    return () => clearInterval(interval);
  }, [decisionId]);

  if (!data) return null;

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Beteiligung</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            data.quorumMet
              ? 'bg-green-100 text-green-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {data.quorumMet ? 'Quorum erreicht' : `Quorum: ${data.quorumTarget}`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {data.voted.length} von {data.total} haben abgestimmt
          </span>
          <span>{data.progressPercent}%</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-all ${
              data.quorumMet ? 'bg-green-500' : 'bg-amber-500'
            }`}
            style={{ width: `${data.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Who hasn't voted */}
      {data.notVoted.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500">Noch nicht abgestimmt:</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {data.notVoted.map((u) => (
              <span
                key={u.id}
                className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
              >
                {u.email}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
