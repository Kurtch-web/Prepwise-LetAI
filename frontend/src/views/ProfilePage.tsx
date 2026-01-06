import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { api, CommunityPost } from '../services/api';
import PostDetailsModal from '../components/PostDetailsModal';
import { MediaStack } from '../components/MediaStack';
import { GalleryModal } from '../components/GalleryModal';

const shellCard = 'rounded-3xl border border-blue-500/20 bg-[#002459]/80 p-7 shadow-[0_18px_40px_rgba(0,36,89,0.45)] backdrop-blur-xl';
const primaryButton = 'rounded-2xl border border-blue-500/30 px-5 py-3 font-semibold text-white transition hover:border-blue-400 hover:bg-blue-500/30';
const subtleButton = 'rounded-2xl border border-blue-500/20 px-5 py-3 font-semibold text-white/80 transition hover:border-rose-400 hover:bg-rose-500/20';
const actionBtn = 'rounded-2xl border border-blue-500/20 px-3 py-1 text-xs font-semibold text-white/80 transition hover:border-blue-400 hover:bg-blue-500/20';
const inputField = 'w-full rounded-2xl border border-blue-500/30 bg-[#001a4d]/60 px-3 py-2 text-sm text-white';

function SelectedFilesPreview({ files, onRemoveIndex }: { files: File[]; onRemoveIndex: (index: number) => void }) {
  const urlMapRef = useRef<Map<File, string>>(new Map());
  const [previews, setPreviews] = useState<{ name: string; type: string; url: string }[]>([]);

  useEffect(() => {
    const map = urlMapRef.current;
    for (const f of files) {
      if (!map.has(f)) map.set(f, URL.createObjectURL(f));
    }
    for (const [f, u] of Array.from(map.entries())) {
      if (!files.includes(f)) {
        URL.revokeObjectURL(u);
        map.delete(f);
      }
    }
    setPreviews(files.map(f => ({ name: f.name, type: f.type, url: map.get(f)! })));
  }, [files]);

  useEffect(() => {
    return () => {
      for (const u of urlMapRef.current.values()) URL.revokeObjectURL(u);
      urlMapRef.current.clear();
    };
  }, []);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {previews.map((p, i) => (
        <div key={`${p.name}-${i}`} className="overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-500/10">
          {p.type.startsWith('image/') ? (
            <img src={p.url} alt={p.name} className="block h-40 w-full object-cover" />
          ) : (
            <div className="px-4 py-3 text-white/80">{p.name}</div>
          )}
          <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
            <span className="truncate text-xs text-white/70">{p.name}</span>
            <button className={actionBtn} onClick={() => onRemoveIndex(i)}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProfilePage() {
  const { session } = useAuth();
  const token = session?.token ?? '';
  const username = session?.username ?? '';
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [selectedTab, setSelectedTab] = useState<'comments' | 'likes'>('comments');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<CommunityPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState<{ url: string; type: string; filename?: string }[]>([]);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.fetchMyCommunityPosts(token);
      setPosts(res.posts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_260px] lg:items-start">
      <aside className="hidden lg:block lg:sticky lg:top-32 lg:self-start">
        <div className={`${shellCard} space-y-4`}>
          <div className="flex flex-col items-center gap-4">
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-4xl font-bold text-white">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-white">{username}</h3>
              <p className="text-sm text-white/60">Member</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-4">
            <p className="text-center text-sm font-semibold text-blue-300 mb-2">Daily Inspiration</p>
            <p className="text-center text-sm text-white/80 italic">
              Always be kind and be happy. Your positive attitude creates ripples of joy in the community.
            </p>
          </div>
        </div>
      </aside>

      <div className="flex flex-col gap-8">
        <div className="grid max-w-[880px] gap-3">
          <h1 className="text-4xl font-extrabold text-white md:text-5xl">{username}</h1>
          <p className="max-w-2xl text-lg text-white/70">Your uploads and activity</p>
        </div>

        <div className="flex items-center gap-3">
          <button className={primaryButton} onClick={load}>Refresh</button>
          <a className={primaryButton} href="/community">Go to Community</a>
        </div>

        {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-rose-200 text-sm">{error}</div>}
        {loading && <div className="text-white/70">Loading…</div>}

        <section className="space-y-5">
          {posts.map(post => (
            <article
              key={post.id}
              className={`${shellCard} min-h-[320px] space-y-3 p-4 sm:p-5 cursor-pointer`}
              onClick={() => setSelectedPost(post)}
            >
              <header className="flex items-center justify-between">
                <div className="text-xs sm:text-sm text-white/70">
                  <span className="text-white/90 font-semibold">{post.authorUsername}</span>
                  <span className="ml-2">{new Date(post.createdAt).toLocaleString()}</span>
                  {post.updatedAt ? <span className="ml-2 text-white/50">• edited</span> : null}
                  {post.isArchived ? <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/70">Archived</span> : null}
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <button className={actionBtn} onClick={() => { setEditingId(post.id); setEditBody(post.body); setEditFiles([]); setRemovedAttachmentIds(new Set()); }}>Edit</button>
                  <button className={actionBtn} onClick={async () => {
                    try { const res = await api.archivePost(token, post.id, !post.isArchived); setPosts(prev => prev.map(p => p.id === post.id ? res.post : p)); } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
                  }}>{post.isArchived ? 'Unarchive' : 'Archive'}</button>
                  <button className={actionBtn} onClick={() => setDeleteTarget(post)}>Delete</button>
                </div>
              </header>
              {editingId === post.id ? (
                <div className="space-y-3" onClick={e => e.stopPropagation()}>
                  <textarea className={`${inputField} min-h-[88px]`} value={editBody} onChange={e => setEditBody(e.target.value)} />
                  {post.attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Attached files</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {post.attachments.map(att => {
                          const removed = removedAttachmentIds.has(att.id);
                          return (
                            <div key={att.id} className={`overflow-hidden rounded-2xl border ${removed ? 'border-white/20 opacity-60' : 'border-white/10'} bg-white/5`}>
                              {att.contentType.startsWith('image/') ? (
                                <img src={att.url} alt={att.filename} className="block h-40 w-full object-cover" />
                              ) : (
                                <a className="block px-4 py-3 text-white/80 hover:text-white" href={att.url} target="_blank" rel="noreferrer">{att.filename}</a>
                              )}
                              <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
                                <span className="truncate text-xs text-white/70">{att.filename}</span>
                                <button className={actionBtn} onClick={() => setRemovedAttachmentIds(prev => { const next = new Set(prev); if (next.has(att.id)) next.delete(att.id); else next.add(att.id); return next; })}>{removed ? 'Restore' : 'Remove'}</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="block text-sm text-white/80">Add images/files</label>
                    <input type="file" multiple className="text-white/80" onChange={e => setEditFiles(prev => [...prev, ...Array.from(e.target.files || [])])} />
                    {editFiles.length > 0 && (
                      <SelectedFilesPreview files={editFiles} onRemoveIndex={(i) => setEditFiles(prev => prev.filter((_, idx) => idx !== i))} />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className={primaryButton} onClick={async () => {
                      try {
                        const tags: string[] = []; // profile edit does not change tags
                        let updated = (await api.updatePost(token, post.id, editBody.trim(), tags)).post;
                        if (editFiles.length) {
                          updated = (await api.addPostAttachments(token, post.id, editFiles)).post;
                        }
                        if (removedAttachmentIds.size) {
                          for (const id of Array.from(removedAttachmentIds)) {
                            await api.deleteAttachment(token, post.id, id);
                          }
                          updated = { ...updated, attachments: updated.attachments.filter(a => !removedAttachmentIds.has(a.id)) };
                        }
                        setPosts(prev => prev.map(p => p.id === post.id ? updated : p));
                        setEditingId(null);
                        setEditBody('');
                        setEditFiles([]);
                        setRemovedAttachmentIds(new Set());
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Failed to update');
                      }
                    }}>Save</button>
                    <button className={subtleButton} onClick={() => { setEditingId(null); setEditBody(''); setEditFiles([]); setRemovedAttachmentIds(new Set()); }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-white/90 whitespace-pre-wrap text-sm sm:text-base line-clamp-6">{post.body}</p>
                  {post.attachments.length > 0 && (
                    <div onClick={e => e.stopPropagation()}>
                      <MediaStack
                        items={post.attachments.map(att => ({ url: att.url, type: att.contentType, filename: att.filename }))}
                        onOpen={(startIndex) => {
                          const items = post.attachments.map(att => ({ url: att.url, type: att.contentType, filename: att.filename }));
                          setGalleryItems(items);
                          setGalleryStartIndex(startIndex);
                          setGalleryOpen(true);
                        }}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs sm:text-sm text-white/80">
                    <button
                      className="underline decoration-white/30 underline-offset-4 hover:text-white"
                      onClick={e => { e.stopPropagation(); setSelectedPost(post); setSelectedTab('likes'); }}
                    >
                      {post.likeCount} like{post.likeCount === 1 ? '' : 's'}
                    </button>
                    <button
                      className="underline decoration-white/30 underline-offset-4 hover:text-white"
                      onClick={e => { e.stopPropagation(); setSelectedPost(post); setSelectedTab('comments'); }}
                    >
                      {post.commentCount} comment{post.commentCount === 1 ? '' : 's'}
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </section>

        {selectedPost && (
          <PostDetailsModal
            token={token}
            post={selectedPost}
            initialTab={selectedTab}
            onCommentAdded={(c) => {
              setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, commentCount: p.commentCount + 1, comments: [...p.comments, c] } : p));
            }}
            onClose={() => setSelectedPost(null)}
          />
        )}

        {galleryOpen && (
          <GalleryModal items={galleryItems} startIndex={galleryStartIndex} onClose={() => setGalleryOpen(false)} />
        )}

        {deleteTarget ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-6">
            <div className="w-full max-w-lg rounded-3xl border border-blue-500/20 bg-[#002459]/90 p-6 shadow-[0_18px_40px_rgba(0,36,89,0.55)] backdrop-blur-xl">
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Delete post</h3>
                <button className={subtleButton} onClick={() => setDeleteTarget(null)} disabled={deleting}>Close</button>
              </header>
              <div className="space-y-3">
                <p className="text-white/80 text-sm">This will delete the post, its comments, likes, and any files. This cannot be undone.</p>
                <div className="flex items-center gap-2">
                  <button className={primaryButton} onClick={async () => {
                    if (!deleteTarget) return;
                    try {
                      setDeleting(true);
                      await api.deletePost(token, deleteTarget.id);
                      setPosts(prev => prev.filter(p => p.id !== deleteTarget.id));
                      setDeleteTarget(null);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : 'Failed to delete');
                    } finally {
                      setDeleting(false);
                    }
                  }} disabled={deleting} aria-busy={deleting}>
                    {deleting ? (
                      <span className="inline-flex items-center">
                        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Deleting…
                      </span>
                    ) : 'Delete'}
                  </button>
                  <button className={subtleButton} onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <aside className="hidden lg:block lg:sticky lg:top-32 lg:self-start">
        <div className={`${shellCard} space-y-4 lg:max-h-[calc(100vh-128px)] lg:overflow-auto`}>
          <h2 className="text-lg font-semibold text-white">Posting reminders</h2>
          <p className="text-sm text-white/70">Keep the community welcoming by following these quick guidelines:</p>
          <ul className="list-inside list-disc space-y-2 text-sm text-white/80">
            <li>Skip personal or confidential information.</li>
            <li>Keep language respectful and constructive.</li>
            <li>Flag anything concerning so admins can review it fast.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

export default ProfilePage;
