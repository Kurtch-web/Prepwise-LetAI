import { useCallback, useEffect, useMemo, useState } from 'react';

export type GalleryItem = { url: string; type: string; filename?: string };

export function GalleryModal({ items, startIndex = 0, onClose }: { items: GalleryItem[]; startIndex?: number; onClose: () => void }) {
  const [index, setIndex] = useState(Math.min(Math.max(0, startIndex), Math.max(0, items.length - 1)));
  const total = items.length;

  const prev = useCallback(() => setIndex(i => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIndex(i => (i + 1) % total), [total]);

  const current = useMemo(() => items[index], [items, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, next, prev]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4" onClick={onClose}>
      <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-[#0b111a]/90 shadow-[0_18px_40px_rgba(4,10,20,0.55)] backdrop-blur-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4">
          <div className="text-white/80 text-sm">
            {index + 1} / {total} {current.filename ? `— ${current.filename}` : ''}
          </div>
          <div className="flex items-center gap-2">
            <button aria-label="Previous" className="rounded-2xl border border-white/10 px-3 py-2 text-white/80 hover:border-white/20 hover:text-white" onClick={prev}>
              ◀
            </button>
            <button aria-label="Next" className="rounded-2xl border border-white/10 px-3 py-2 text-white/80 hover:border-white/20 hover:text-white" onClick={next}>
              ▶
            </button>
            <button aria-label="Close" className="rounded-2xl border border-white/10 px-3 py-2 text-white/80 hover:border-rose-400 hover:bg-rose-500/20" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <div className="max-h-[75vh] w-full overflow-hidden">
          {current.type.startsWith('image/') ? (
            <img src={current.url} alt={current.filename || ''} className="mx-auto block max-h-[75vh] w-auto object-contain" />
          ) : (
            <div className="p-6 text-center text-white/80">
              <a className="underline" href={current.url} target="_blank" rel="noreferrer">
                {current.filename || current.url}
              </a>
            </div>
          )}
        </div>
        {items.length > 1 && (
          <div className="flex items-center gap-2 p-3 overflow-x-auto">
            {items.map((it, i) => (
              <button key={`${it.url}-${i}`} className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl border ${i === index ? 'border-white/60' : 'border-white/10'} bg-white/5`} onClick={() => setIndex(i)}>
                {it.type.startsWith('image/') ? (
                  <img src={it.url} alt={it.filename || ''} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-white/70">{it.filename || 'file'}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
