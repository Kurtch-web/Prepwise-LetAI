import React from 'react';

export type MediaItem = { url: string; type: string; filename?: string };

export function MediaStack({ items, onOpen, className = '' }: { items: MediaItem[]; onOpen?: (startIndex: number) => void; className?: string }) {
  if (!items.length) return null;
  const images = items.filter(i => i.type.startsWith('image/'));
  const primary = images[0] || items[0];
  const count = items.length;

  return (
    <button type="button" className={`relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 ${className}`} onClick={() => onOpen?.(0)}>
      {primary.type.startsWith('image/') ? (
        <img src={primary.url} alt={primary.filename || ''} className="block h-48 w-full object-cover sm:h-56" />
      ) : (
        <div className="px-4 py-6 text-white/80">{primary.filename || primary.url}</div>
      )}
      {count > 1 && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-2 top-2 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white">+{count - 1}</div>
          {images[1] && (
            <img src={images[1].url} alt={images[1].filename || ''} className="absolute bottom-2 right-2 h-10 w-16 rounded-lg object-cover opacity-80 ring-1 ring-white/20" />
          )}
        </div>
      )}
    </button>
  );
}
