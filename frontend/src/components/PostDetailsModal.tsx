import { useEffect, useMemo, useState } from 'react';
import { api, CommunityComment, CommunityPost } from '../services/api';

export function PostDetailsModal({ token, post, onClose, initialTab = 'comments', onCommentAdded }: { token: string; post: CommunityPost; onClose: () => void; initialTab?: 'comments' | 'likes'; onCommentAdded?: (c: CommunityComment) => void }) {
  const [comments, setComments] = useState<CommunityComment[]>(post.comments || []);
  const [likers, setLikers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'comments' | 'likes'>(initialTab);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  const canPost = useMemo(() => draft.trim().length > 0 && !posting, [draft, posting]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [c, l] = await Promise.all([
          api.fetchComments(token, post.id),
          api.fetchLikes(token, post.id)
        ]);
        if (!active) return;
        setComments(c.comments);
        setLikers(l.likes);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'Failed to load details');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [token, post.id]);

  const submitComment = async () => {
    const body = draft.trim();
    if (!body) return;
    setPosting(true);
    try {
      const res = await api.addComment(token, post.id, body);
      setComments(prev => [...prev, res.comment]);
      setDraft('');
      onCommentAdded?.(res.comment);
      setTab('comments');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add comment');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-6">
      <div className="w-full max-w-6xl rounded-3xl border border-white/10 bg-[#0b111a]/90 p-8 sm:p-10 shadow-[0_18px_40px_rgba(4,10,20,0.55)] backdrop-blur-xl">
        <header className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Post details</h2>
            <p className="text-white/70">{new Date(post.createdAt).toLocaleString()}</p>
          </div>
          <button
            type="button"
            className="rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white/80 transition hover:border-rose-400 hover:bg-rose-500/20"
            onClick={onClose}
          >
            Close
          </button>
        </header>

        <div className="mt-5 space-y-6 max-h-[85vh] overflow-y-auto pr-2">
          <p className="text-white/90 whitespace-pre-wrap">{post.body}</p>
          {post.attachments.length > 0 && (
            <div
              className={`grid grid-flow-dense gap-2 sm:gap-3 ${
                post.attachments.length === 1 ? 'grid-cols-1' : post.attachments.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
              } auto-rows-[120px] sm:auto-rows-[160px]`}
            >
              {post.attachments.map((att, i) => {
                const spanLarge = post.attachments.length === 1 || (post.attachments.length >= 3 && i % 5 === 0);
                const cellClass = spanLarge ? 'col-span-2 row-span-2' : '';
                const isImage = att.contentType.startsWith('image/');
                return (
                  <div key={att.id} className={`rounded-2xl overflow-hidden border border-white/10 bg-white/5 ${cellClass}`}>
                    {isImage ? (
                      <img src={att.url} alt={att.filename} className="block h-full w-full object-cover" />
                    ) : (
                      <a className="block px-4 py-3 text-white/80 hover:text-white" href={att.url} target="_blank" rel="noreferrer">{att.filename}</a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/5 p-1">
            <div className="flex gap-2 p-2">
              <button
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${tab === 'comments' ? 'bg-[#0b111a] text-white' : 'text-white/80 hover:text-white'}`}
                onClick={() => setTab('comments')}
              >
                Comments ({comments.length})
              </button>
              <button
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold ${tab === 'likes' ? 'bg-[#0b111a] text-white' : 'text-white/80 hover:text-white'}`}
                onClick={() => setTab('likes')}
              >
                Likes ({likers.length})
              </button>
            </div>

            {error && <div className="mx-3 my-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-rose-200 text-sm">{error}</div>}
            {loading && <div className="mx-3 my-2 text-white/70">Loading…</div>}

            {!loading && tab === 'comments' && (
              <div className="px-4 pb-4">
                <ul className="mt-2 max-h-[60vh] overflow-auto space-y-3">
                  {comments.length === 0 && <li className="text-white/60">No comments yet</li>}
                  {comments.map(c => (
                    <li key={c.id} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                      <div className="text-sm text-white/70">
                        <span className="font-semibold text-white/90">{c.authorUsername}</span>
                        <span className="ml-2">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-white/90 whitespace-pre-wrap">{c.body}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    className="w-full rounded-2xl border border-white/20 bg-[#080c14]/60 px-3 py-2 text-sm text-white"
                    placeholder="Write a comment"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                  />
                  <button
                    className="rounded-2xl border border-white/20 px-5 py-2 font-semibold text-white transition hover:border-indigo-400 hover:bg-indigo-500/20"
                    disabled={!canPost}
                    onClick={submitComment}
                  >
                    Post
                  </button>
                </div>
              </div>
            )}

            {!loading && tab === 'likes' && (
              <div className="px-4 pb-4">
                <ul className="mt-2 max-h-[60vh] overflow-auto space-y-2">
                  {likers.length === 0 && <li className="text-white/60">No likes yet</li>}
                  {likers.map(name => (
                    <li key={name} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <span className="text-white">{name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostDetailsModal;
