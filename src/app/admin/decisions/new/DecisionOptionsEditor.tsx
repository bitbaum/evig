'use client';

import { type OptionItem } from './useDecisionForm';

interface Props {
  options: OptionItem[];
  showImageUrls: boolean;
  onShowImageUrlsChange: (v: boolean) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: 'label' | 'description' | 'imageUrl', value: string) => void;
}

export function DecisionOptionsEditor({
  options, showImageUrls, onShowImageUrlsChange, onAdd, onRemove, onUpdate,
}: Props) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Optionen</span>
        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-500">
          <input
            type="checkbox"
            checked={showImageUrls}
            onChange={(e) => onShowImageUrlsChange(e.target.checked)}
            className="rounded"
          />
          Bild-URLs hinzufügen (für visuelle Abstimmung)
        </label>
      </div>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={opt.id} className="rounded-md border border-gray-200 p-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={opt.label}
                onChange={(e) => onUpdate(opt.id, 'label', e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                value={opt.description}
                onChange={(e) => onUpdate(opt.id, 'description', e.target.value)}
                placeholder="Beschreibung (optional)"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => onRemove(opt.id)}
                disabled={options.length <= 2}
                className="rounded-md px-2 text-gray-500 hover:text-red-500 disabled:opacity-30"
              >
                &times;
              </button>
            </div>
            {showImageUrls && (
              <div className="mt-1.5 flex gap-2">
                <input
                  type="url"
                  value={opt.imageUrl}
                  onChange={(e) => onUpdate(opt.id, 'imageUrl', e.target.value)}
                  placeholder="Bild-URL (https://...)"
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {opt.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={opt.imageUrl}
                    alt=""
                    className="h-8 w-8 rounded object-contain border border-gray-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 text-sm text-blue-600 hover:underline"
      >
        + Option hinzufügen
      </button>
    </div>
  );
}
