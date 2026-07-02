'use client';

import Image from 'next/image';

export interface VotingOption {
  id: string;
  label: string;
  description?: string;
  imageUrl?: string;
}

export function OptionCard({
  opt,
  selected,
  onClick,
  children,
}: {
  opt: VotingOption;
  selected: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col rounded-xl border-2 transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${
        selected
          ? 'border-action bg-action-muted shadow-md'
          : 'border bg-surface-base hover:border-strong hover:shadow-xs'
      }`}
    >
      {/* Image */}
      {opt.imageUrl ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-surface-raised">
          <Image
            src={opt.imageUrl}
            alt={opt.label}
            fill
            className="object-contain p-2"
          />
          {selected && (
            <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-action text-white shadow-sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
      ) : (
        <div className={`flex aspect-square w-full items-center justify-center rounded-t-xl text-4xl font-bold ${selected ? 'bg-action-muted text-action' : 'bg-surface-raised text-text-muted'}`}>
          {opt.label.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Label + controls */}
      <div className="p-3">
        <p className={`truncate text-sm font-medium ${selected ? 'text-action' : 'text-text-primary'}`}>
          {opt.label}
        </p>
        {opt.description && (
          <p className="mt-0.5 truncate text-xs text-text-tertiary">{opt.description}</p>
        )}
        {children}
      </div>
    </div>
  );
}
