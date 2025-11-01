import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { api, CommunityPost, CommunityComment, UserProfile } from '../services/api';
import { MediaStack } from '../components/MediaStack';
import { GalleryModal } from '../components/GalleryModal';

const shellCard = 'rounded-3xl border border-white/10 bg-[#0b111a]/80 p-7 shadow-[0_18px_40px_rgba(4,10,20,0.45)] backdrop-blur-xl';
const primaryButton = 'rounded-2xl border border-white/20 px-5 py-3 font-semibold text-white transition hover:border-indigo-400 hover:bg-indigo-500/20';
const subtleButton = 'rounded-2xl border border-white/10 px-5 py-3 font-semibold text-white/80 transition hover:border-rose-400 hover:bg-rose-500/20';
const chip = 'inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80';
const emailStatusBadge = (verified: boolean) =>
  `inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
    verified
      ? 'bg-emerald-500/20 text-emerald-300'
      : 'bg-amber-500/20 text-amber-300'
  }`;

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const token = session?.token ?? '';
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    if (!token || !username) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.fetchUserProfile(token, username);
        setProfile(res.profile);
        setPosts(res.posts);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, username]);

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

  if (!username) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white/60">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-rose-200 text-sm">{error}</div>
        <button
          className={primaryButton}
          onClick={() => navigate('/community')}
        >
          Back to Community
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="text-white/60">Profile not found</div>
        <button
          className={primaryButton}
          onClick={() => navigate('/community')}
        >
          Back to Community
        </button>
      </div>
    );
  }

  const displayName = profile.displayName || profile.firstName || profile.username;

  return (
    <div className="flex flex-col gap-8">
      <button
        onClick={() => navigate('/community')}
        className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition mb-4"
      >
        <span>←</span>
        <span className="font-semibold">Back to Community</span>
      </button>

      <div className={`${shellCard} space-y-4`}>
        <div className="flex items-start gap-6">
          {profile.avatarUrl && (
            <img
              src={profile.avatarUrl}
              alt={displayName}
              className="h-24 w-24 rounded-2xl border border-white/10 object-cover"
            />
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold text-white md:text-5xl">{displayName}</h1>
            <p className="text-lg text-white/70">@{profile.username}</p>
            <p className="mt-2 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 uppercase tracking-wide">
              {profile.role}
            </p>
            {profile.bio && (
              <p className="mt-4 text-white/90">{profile.bio}</p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {profile.email && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Email</p>
                <div className={emailStatusBadge(!!profile.emailVerifiedAt)}>
                  <div className={`h-2 w-2 rounded-full ${profile.emailVerifiedAt ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {profile.emailVerifiedAt ? 'Verified' : 'Unverified'}
                </div>
              </div>
              <p className="text-white/90">{profile.email}</p>
            </div>
          )}
          {profile.timezone && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Timezone</p>
              <p className="text-white/90">{profile.timezone}</p>
            </div>
          )}
          {profile.firstName && profile.lastName && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Full Name</p>
              <p className="text-white/90">{profile.firstName} {profile.lastName}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white mb-4">Posts ({posts.length})</h2>
          {posts.length === 0 ? (
            <div className="text-white/60">This user hasn't posted anything yet.</div>
          ) : (
            posts.map(post => (
              <article key={post.id} className={`${shellCard} min-h-[200px] space-y-4 mb-5`}>
                <header className="flex items-center justify-between">
                  <div className="text-sm text-white/70">
                    <span className="text-white/90 font-semibold">{post.authorUsername}</span>
                    <span className="ml-2">{new Date(post.createdAt).toLocaleString()}</span>
                    {post.updatedAt ? <span className="ml-2 text-white/50">• edited</span> : null}
                    {post.isArchived ? <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/70">Archived</span> : null}
                  </div>
                </header>

                <p className="text-white/90 whitespace-pre-wrap">{post.body}</p>

                {post.tags && post.tags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map(t => <span key={`${post.id}-tag-${t}`} className={chip}>#{t}</span>)}
                  </div>
                ) : null}

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
                  <button
                    className={`text-white/80 hover:text-white transition ${post.likeCount > 0 ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={() => post.likeCount > 0 && openLikesModal(post.id)}
                  >
                    ❤️ {post.likeCount} {post.likeCount === 1 ? 'like' : 'likes'}
                  </button>
                  <button
                    className="text-white/80 hover:text-white transition cursor-pointer"
                    onClick={() => openCommentsModal(post.id)}
                  >
                    💬 {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
                  </button>
                </div>

                {post.comments.length > 0 && (
                  <div className="space-y-2 border-t border-white/10 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Recent Comments</p>
                    {post.comments.slice(0, 3).map((c) => (
                      <div key={c.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
                        <span className="font-semibold text-white/90">{c.authorUsername}</span>
                        <span className="ml-2 text-white/60">{new Date(c.createdAt).toLocaleString()}</span>
                        <p className="text-white/90 whitespace-pre-wrap mt-1">{c.body}</p>
                      </div>
                    ))}
                    {post.comments.length > 3 && (
                      <p className="text-xs text-white/60">+{post.comments.length - 3} more comments</p>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </div>

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

export default UserProfilePage;
