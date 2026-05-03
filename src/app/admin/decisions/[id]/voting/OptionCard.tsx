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
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm'
      }`}
    >
      {/* Image */}
      {opt.imageUrl ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-neutral-100">
          <Image
            src={opt.imageUrl}
            alt={opt.label}
            fill
            className="object-contain p-2"
            unoptimized
          />
          {selected && (
            <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
      ) : (
        <div className={`flex aspect-square w-full items-center justify-center rounded-t-xl text-4xl font-bold ${selected ? 'bg-blue-100 text-blue-600' : 'bg-neutral-100 text-neutral-400'}`}>
          {opt.label.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Label + controls */}
      <div className="p-3">
        <p className={`truncate text-sm font-medium ${selected ? 'text-blue-700' : 'text-neutral-800'}`}>
          {opt.label}
        </p>
        {opt.description && (
          <p className="mt-0.5 truncate text-xs text-neutral-500">{opt.description}</p>
        )}
        {children}
      </div>
    </div>
  );
}
