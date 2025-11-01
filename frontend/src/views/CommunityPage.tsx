import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { api, CommunityPost, CommunityComment } from '../services/api';
import { MediaStack } from '../components/MediaStack';
import { GalleryModal } from '../components/GalleryModal';

const shellCard = 'rounded-3xl border border-white/10 bg-[#0b111a]/80 p-7 shadow-[0_18px_40px_rgba(4,10,20,0.45)] backdrop-blur-xl';
const primaryButton = 'rounded-2xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:border-indigo-400 hover:bg-indigo-500/20';
const subtleButton = 'rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white/80 transition hover:border-rose-400 hover:bg-rose-500/20';
const inputField = 'w-full rounded-2xl border border-white/20 bg-[#080c14]/60 px-3 py-2 text-sm text-white';
const chip = 'inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80';
const actionBtn = 'rounded-2xl border border-white/10 px-3 py-1 text-xs font-semibold text-white/80 transition hover:border-indigo-400 hover:bg-indigo-500/20';

function extractHashtags(text: string): string[] {
  const tags = new Set<string>();
  const regex = /(^|\s)#([\p{L}\d_]+)/gu;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const tag = (m[2] || '').trim().toLowerCase();
    if (tag) tags.add(tag);
  }
  return Array.from(tags);
}

function MediaGallery({
  items
}: {
  items: { key: string; url: string; type: string; filename?: string }[];
}) {
  const count = items.length;
  return (
    <div
      className={`grid grid-flow-dense gap-2 sm:gap-3 ${
        count === 1 ? 'grid-cols-1' : count === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'
      } auto-rows-[120px] sm:auto-rows-[160px]`}
    >
      {items.map((it, i) => {
        const isImage = it.type.startsWith('image/');
        const spanLarge = count === 1 || (count >= 3 && i % 5 === 0);
        const cellClass = spanLarge ? 'col-span-2 row-span-2' : '';
        return (
          <div key={it.key} className={`overflow-hidden rounded-2xl border border-white/10 bg-white/5 ${cellClass}`}>
            {isImage ? (
              <img src={it.url} alt={it.filename || ''} className="block h-full w-full object-cover" />
            ) : (
              <a className="block px-4 py-3 text-white/80 hover:text-white" href={it.url} target="_blank" rel="noreferrer">
                {it.filename || it.url}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

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

  const [open, setOpen] = useState(false);
  const items = previews.map((p, i) => ({ key: `${p.name}-${i}`, url: p.url, type: p.type, filename: p.name }));

  if (!previews.length) return null;

  return (
    <div className="space-y-2">
      <MediaStack items={items} onOpen={() => setOpen(true)} />
      <div className="grid gap-2 sm:grid-cols-2">
        {previews.map((p, i) => (
          <div key={`${p.name}-${i}-meta`} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <span className="truncate text-xs text-white/70">{p.name}</span>
            <button className={actionBtn} onClick={() => onRemoveIndex(i)}>Remove</button>
          </div>
        ))}
      </div>
      {open && (
        <GalleryModal items={items.map(it => ({ url: it.url, type: it.type, filename: it.filename }))} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

export function CommunityPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const token = session?.token ?? '';
  const [composerOpen, setComposerOpen] = useState(false);
  const [bodyText, setBodyText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchUsers, setSearchUsers] = useState<Array<{ username: string; role: string }>>([]);
  const [sortMode, setSortMode] = useState<'latest' | 'oldest' | 'most_liked' | 'random'>('latest');
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [reportTarget, setReportTarget] = useState<CommunityPost | null>(null);
  const [reportCategory, setReportCategory] = useState<'spam' | 'harassment' | 'misinformation' | 'off_topic' | 'other'>('spam');
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CommunityPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editFiles, setEditFiles] = useState<File[]>([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState<Set<string>>(new Set());
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryItems, setGalleryItems] = useState<{ url: string; type: string; filename?: string }[]>([]);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [likesModalOpen, setLikesModalOpen] = useState(false);
  const [likesModalPostId, setLikesModalPostId] = useState<string | null>(null);
  const [likesModalUsers, setLikesModalUsers] = useState<string[]>([]);
  const [likesModalLoading, setLikesModalLoading] = useState(false);
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [commentsModalPostId, setCommentsModalPostId] = useState<string | null>(null);
  const [commentsModalData, setCommentsModalData] = useState<CommunityComment[]>([]);
  const [commentsModalLoading, setCommentsModalLoading] = useState(false);

  const canSubmit = useMemo(() => bodyText.trim().length > 0 || files.length > 0, [bodyText, files]);

  const loadInitial = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.fetchCommunityPosts(token, { limit: 20, q: searchQuery || undefined, sort: sortMode });
      setPosts(res.posts);
      setNextCursor(res.nextCursor ?? null);

      // Also search for users if there's a search query
      if (searchQuery) {
        try {
          const usersRes = await api.searchUsers(token, searchQuery);
          setSearchUsers(usersRes.users);
        } catch (e) {
          setSearchUsers([]);
        }
      } else {
        setSearchUsers([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load posts');
    }
  }, [token, searchQuery, sortMode]);

  const loadMore = useCallback(async () => {
    if (!token || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await api.fetchCommunityPosts(token, { limit: 20, before: nextCursor, q: searchQuery || undefined, sort: sortMode });
      setPosts(prev => [...prev, ...res.posts]);
      setNextCursor(res.nextCursor ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }, [token, nextCursor, loadingMore, searchQuery, sortMode]);

  // Immediate reload on sort change or token change
  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, sortMode]);

  // Debounced reload on search query change
  useEffect(() => {
    const id = setTimeout(() => {
      loadInitial();
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery, loadInitial]);

  useEffect(() => {
    const sentinel = document.getElementById('community-infinite-sentinel');
    if (!sentinel) return;
    const io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          loadMore();
        }
      }
    });
    io.observe(sentinel);
    return () => io.disconnect();
  }, [loadMore, nextCursor]);

  const onCreate = useCallback(async () => {
    if (!token || !canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const tags = extractHashtags(bodyText);
      const res = await api.createCommunityPost(token, bodyText.trim(), files, tags);
      setPosts(prev => [res.post, ...prev]);
      // Refresh the just-created post to capture all processed attachments
      try {
        const latest = await api.fetchCommunityPosts(token, { limit: 1 });
        const first = latest.posts[0];
        if (first && first.id === res.post.id) {
          setPosts(prev => [first, ...prev.slice(1)]);
        }
      } catch {}
      setBodyText('');
      setFiles([]);
      const el = document.getElementById('community-files') as HTMLInputElement | null;
      if (el) el.value = '';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  }, [token, canSubmit, bodyText, files]);

  const toggleLike = useCallback(async (post: CommunityPost) => {
    if (!token) return;
    try {
      if (post.likedByMe) {
        await api.unlikePost(token, post.id);
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likedByMe: false, likeCount: Math.max(0, p.likeCount - 1) } : p));
      } else {
        await api.likePost(token, post.id);
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likedByMe: true, likeCount: p.likeCount + 1 } : p));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update like');
    }
  }, [token]);

  const postComment = useCallback(async (postId: string) => {
    if (!token) return;
    const draft = (commentDrafts[postId] || '').trim();
    if (!draft) return;
    try {
      const res = await api.addComment(token, postId, draft);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, res.comment], commentCount: p.commentCount + 1 } : p));
      setCommentDrafts(prev => ({ ...prev, [postId]: '' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add comment');
    }
  }, [token, commentDrafts]);

  const openLikesModal = useCallback(async (postId: string) => {
    if (!token) return;
    setLikesModalPostId(postId);
    setLikesModalLoading(true);
    try {
      const res = await api.fetchLikes(token, postId);
      setLikesModalUsers(res.likes);
      setLikesModalOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load likes');
    } finally {
      setLikesModalLoading(false);
    }
  }, [token]);

  const openCommentsModal = useCallback(async (postId: string) => {
    if (!token) return;
    setCommentsModalPostId(postId);
    setCommentsModalLoading(true);
    try {
      const res = await api.fetchComments(token, postId);
      setCommentsModalData(res.comments);
      setCommentsModalOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load comments');
    } finally {
      setCommentsModalLoading(false);
    }
  }, [token]);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)_260px] lg:items-start">
      <aside className="hidden lg:block lg:sticky lg:top-32 lg:self-start">
        <div className={`${shellCard} min-h-[360px]`} aria-hidden="true" />
      </aside>

      <div className="flex flex-col gap-8">
        <div className="grid max-w-[880px] gap-3">
          <h1 className="text-4xl font-extrabold text-white md:text-5xl">Community</h1>
          <p className="max-w-2xl text-lg text-white/70">Share updates, files, and images. Like and comment to engage with others.</p>
        </div>

        <section className={`${shellCard} space-y-4`}>
          <h3 className="text-xl font-semibold text-white">Create a post</h3>
          {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-rose-200 text-sm">{error}</div>}
          {!composerOpen ? (
            <button
              className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-left text-white/70 hover:text-white"
              onClick={() => setComposerOpen(true)}
            >
              What's on your mind?
            </button>
          ) : (
            <>
              <textarea
                className={`${inputField} min-h-[88px]`}
                placeholder="What's on your mind?"
                value={bodyText}
                onChange={e => setBodyText(e.target.value)}
                onPaste={e => {
                  const items = Array.from(e.clipboardData?.items || []);
                  const images: File[] = [];
                  for (const item of items) {
                    if (item.kind === 'file') {
                      const f = item.getAsFile();
                      if (f && f.type.startsWith('image/')) images.push(f);
                    }
                  }
                  if (images.length) setFiles(prev => [...prev, ...images]);
                }}
              />
              <input
                id="community-files"
                type="file"
                multiple
                className="text-white/80"
                onChange={e => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
              />
              {files.length > 0 && (
                <SelectedFilesPreview files={files} onRemoveIndex={(i) => setFiles(prev => prev.filter((_, idx) => idx !== i))} />
              )}
              <div className="flex items-center gap-3">
                <button disabled={!canSubmit || loading} className={primaryButton} onClick={onCreate}>
                  {loading ? 'Posting…' : 'Post'}
                </button>
                <button className={subtleButton} onClick={() => { setComposerOpen(false); setBodyText(''); setFiles([]); const el = document.getElementById('community-files') as HTMLInputElement | null; if (el) el.value=''; }}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </section>

        <section className="space-y-5">
          <div className={`${shellCard} flex flex-col gap-3`}
               aria-label="Feed filters">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                className={inputField}
                placeholder="Search posts or members by name"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <select
                className={inputField}
                value={sortMode}
                onChange={e => setSortMode(e.target.value as any)}
                aria-label="Sort posts"
              >
                <option value="latest">Latest</option>
                <option value="most_liked">Most liked</option>
                <option value="oldest">Oldest</option>
                <option value="random">Random</option>
              </select>
            </div>
            {sortMode !== 'latest' && (
              <p className="text-xs text-white/60">Pagination is available only for Latest.</p>
            )}

            {searchQuery && searchUsers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Members</p>
                <div className="grid gap-2">
                  {searchUsers.map(user => (
                    <button
                      key={user.username}
                      onClick={() => navigate(`/user/${user.username}`)}
                      className="w-full text-left rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:border-indigo-400 hover:bg-indigo-500/10"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{user.username}</p>
                          <p className="text-xs text-white/60 uppercase tracking-wide">{user.role}</p>
                        </div>
                        <span className="text-white/60">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {posts.map(post => (
            <article key={post.id} className={`${shellCard} min-h-[340px] space-y-4`}>
              <header className="flex items-center justify-between">
                <div className="text-sm text-white/70">
                  <button
                    onClick={() => navigate(`/user/${post.authorUsername}`)}
                    className="text-white/90 font-semibold hover:text-indigo-400 transition"
                  >
                    {post.authorUsername}
                  </button>
                  <span className="ml-2">{new Date(post.createdAt).toLocaleString()}</span>
                  {post.updatedAt ? <span className="ml-2 text-white/50">• edited</span> : null}
                  {post.isArchived ? <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/70">Archived</span> : null}
                </div>
                <div className="flex items-center gap-2">
                  {post.canReport ? (
                    <button className={actionBtn} onClick={() => setReportTarget(post)}>Report</button>
                  ) : null}
                  {post.canEdit ? (
                    <>
                      <button className={actionBtn} onClick={() => { setEditingId(post.id); setEditBody(post.body); setEditFiles([]); setRemovedAttachmentIds(new Set()); }}>Edit</button>
                      <button className={actionBtn} onClick={async () => {
                        try {
                          const res = await api.archivePost(token, post.id, !post.isArchived);
                          setPosts(prev => prev.map(p => p.id === post.id ? res.post : p));
                        } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
                      }}>{post.isArchived ? 'Unarchive' : 'Archive'}</button>
                      <button className={actionBtn} onClick={() => setDeleteTarget(post)}>Delete</button>
                    </>
                  ) : null}
                </div>
              </header>
              {editingId === post.id ? (
                <div className="space-y-3">
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
                                <button
                                  className={actionBtn}
                                  onClick={() => setRemovedAttachmentIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(att.id)) next.delete(att.id); else next.add(att.id);
                                    return next;
                                  })}
                                >{removed ? 'Restore' : 'Remove'}</button>
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
                        const tags = extractHashtags(editBody);
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
                  <p className="text-white/90 whitespace-pre-wrap">{post.body}</p>
                  {post.tags && post.tags.length ? (
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map(t => <span key={`${post.id}-tag-${t}`} className={chip}>#{t}</span>)}
                    </div>
                  ) : null}
                </>
              )}
              {post.attachments.length > 0 && (
                <MediaStack
                  items={post.attachments.map(att => ({ url: att.url, type: att.contentType, filename: att.filename }))}
                  onOpen={(startIndex) => {
                    const items = post.attachments.map(att => ({ url: att.url, type: att.contentType, filename: att.filename }));
                    setGalleryItems(items);
                    setGalleryStartIndex(startIndex);
                    setGalleryOpen(true);
                  }}
                />
              )}
              <div className="flex items-center gap-4 text-sm text-white/80">
                <button className={primaryButton} onClick={() => toggleLike(post)}>
                  {post.likedByMe ? 'Unlike' : 'Like'}
                </button>
                <button
                  className={`text-white/80 hover:text-white transition ${post.likeCount > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                  onClick={() => post.likeCount > 0 && openLikesModal(post.id)}
                >
                  {post.likeCount} like{post.likeCount === 1 ? '' : 's'}
                </button>
                <button
                  className="text-white/80 hover:text-white transition cursor-pointer"
                  onClick={() => openCommentsModal(post.id)}
                >
                  {post.commentCount} comment{post.commentCount === 1 ? '' : 's'}
                </button>
              </div>
              <div className="space-y-2">
                {post.comments.map((c: CommunityComment) => (
                  <div key={c.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
                    <button
                      onClick={() => navigate(`/user/${c.authorUsername}`)}
                      className="font-semibold text-white/90 hover:text-indigo-400 transition"
                    >
                      {c.authorUsername}
                    </button>
                    <span className="ml-2 text-white/60">{new Date(c.createdAt).toLocaleString()}</span>
                    <p className="text-white/90 whitespace-pre-wrap">{c.body}</p>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    className={inputField}
                    placeholder="Write a comment"
                    value={commentDrafts[post.id] || ''}
                    onChange={e => setCommentDrafts(prev => ({ ...prev, [post.id]: e.target.value }))}
                  />
                  <button className={primaryButton} onClick={() => postComment(post.id)}>Comment</button>
                </div>
              </div>
            </article>
          ))}
          <div id="community-infinite-sentinel" className="h-10" />
          {loadingMore && <div className="text-white/60">Loading more…</div>}
        </section>

        {reportTarget ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-6">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b111a]/90 p-6 shadow-[0_18px_40px_rgba(4,10,20,0.55)] backdrop-blur-xl">
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Report post</h3>
                <button className={subtleButton} onClick={() => setReportTarget(null)}>Close</button>
              </header>
              <div className="space-y-3">
                <label className="block text-sm text-white/80">Category</label>
                <select className={`${inputField}`} value={reportCategory} onChange={e => setReportCategory(e.target.value as any)}>
                  <option value="spam">Spam</option>
                  <option value="harassment">Harassment</option>
                  <option value="misinformation">Misinformation</option>
                  <option value="off_topic">Off topic</option>
                  <option value="other">Other</option>
                </select>
                <label className="block text-sm text-white/80">Reason (optional)</label>
                <textarea className={`${inputField} min-h-[80px]`} value={reportReason} onChange={e => setReportReason(e.target.value)} />
                <div className="flex items-center gap-2">
                  <button className={primaryButton} disabled={reporting} onClick={async () => {
                    if (!reportTarget) return;
                    setReporting(true);
                    try { await api.reportPost(token, reportTarget.id, reportCategory, reportReason.trim() || undefined); setReportTarget(null); setReportReason(''); } catch (e) { setError(e instanceof Error ? e.message : 'Failed to report'); } finally { setReporting(false); }
                  }}>Submit</button>
                  <button className={subtleButton} onClick={() => setReportTarget(null)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {deleteTarget ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-6">
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b111a]/90 p-6 shadow-[0_18px_40px_rgba(4,10,20,0.55)] backdrop-blur-xl">
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
          <p className="text-sm text-white/70">Keep conversations productive and safe:</p>
          <ul className="list-inside list-disc space-y-2 text-sm text-white/80">
            <li>Focus on workspace topics and helpful updates.</li>
            <li>Do not share private personal data or credentials.</li>
            <li>Report suspicious links or behavior immediately.</li>
          </ul>
        </div>
      </aside>

      {galleryOpen && (
        <GalleryModal items={galleryItems} startIndex={galleryStartIndex} onClose={() => setGalleryOpen(false)} />
      )}

      {likesModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-6">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b111a]/90 p-6 shadow-[0_18px_40px_rgba(4,10,20,0.55)] backdrop-blur-xl">
            <header className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">People who liked this</h3>
              <button className={subtleButton} onClick={() => setLikesModalOpen(false)}>Close</button>
            </header>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {likesModalLoading ? (
                <div className="text-white/60 text-sm">Loading...</div>
              ) : likesModalUsers.length === 0 ? (
                <div className="text-white/60 text-sm">No likes yet</div>
              ) : (
                likesModalUsers.map(username => (
                  <button
                    key={username}
                    onClick={() => {
                      setLikesModalOpen(false);
                      navigate(`/user/${username}`);
                    }}
                    className="block w-full text-left rounded-2xl border border-white/10 bg-white/5 px-4 py-2 transition hover:border-indigo-400 hover:bg-indigo-500/10"
                  >
                    <span className="font-semibold text-white">{username}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {commentsModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-6">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0b111a]/90 p-6 shadow-[0_18px_40px_rgba(4,10,20,0.55)] backdrop-blur-xl max-h-[80vh] flex flex-col">
            <header className="mb-4 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-white">All comments</h3>
              <button className={subtleButton} onClick={() => setCommentsModalOpen(false)}>Close</button>
            </header>
            <div className="space-y-2 overflow-y-auto flex-1">
              {commentsModalLoading ? (
                <div className="text-white/60 text-sm">Loading...</div>
              ) : commentsModalData.length === 0 ? (
                <div className="text-white/60 text-sm">No comments yet</div>
              ) : (
                commentsModalData.map((c: CommunityComment) => (
                  <div key={c.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <button
                      onClick={() => {
                        setCommentsModalOpen(false);
                        navigate(`/user/${c.authorUsername}`);
                      }}
                      className="font-semibold text-white/90 hover:text-indigo-400 transition"
                    >
                      {c.authorUsername}
                    </button>
                    <span className="ml-2 text-xs text-white/60">{new Date(c.createdAt).toLocaleString()}</span>
                    <p className="text-white/90 whitespace-pre-wrap mt-2">{c.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityPage;
