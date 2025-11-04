import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

interface ReportedPost {
  id: string;
  postId: string;
  postAuthor: string;
  postAuthorId: number | null;
  postBody: string;
  postCreatedAt: string;
  attachments: Array<{
    id: string;
    filename: string;
    contentType: string;
    url: string | null;
  }>;
  reportedBy: string;
  category: string;
  reason: string;
  createdAt: string;
}

interface ReportedPostsTabProps {
  token: string;
}

export function ReportedPostsTab({ token }: ReportedPostsTabProps) {
  const [reports, setReports] = useState<ReportedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportedPost | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchReportedPosts(token);
      setReports(data.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reported posts');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchReports]);

  const handleDeletePost = async () => {
    if (!selectedReport) return;

    setDeleting(true);
    try {
      await api.deleteReportedPost(token, selectedReport.id, customReason);
      setReports(reports.filter(r => r.id !== selectedReport.id));
      setSelectedReport(null);
      setCustomReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    } finally {
      setDeleting(false);
    }
  };

  const getViolationColor = (category: string): string => {
    switch (category) {
      case 'spam':
        return 'bg-red-500/20 text-red-300 border-red-400/30';
      case 'harassment':
        return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
      case 'misinformation':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'off_topic':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'other':
      default:
        return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
    }
  };

  return (
    <section className="rounded-3xl border border-blue-500/20 bg-[#002459]/80 p-7 shadow-[0_18px_40px_rgba(0,36,89,0.45)] backdrop-blur-xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-white">Reported Posts</h3>
          <p className="text-sm text-white/70">{reports.length} post{reports.length === 1 ? '' : 's'} reported</p>
        </div>
        <button
          className="rounded-2xl border border-blue-500/30 px-5 py-3 font-semibold text-white transition hover:border-blue-400 hover:bg-blue-500/30"
          type="button"
          onClick={fetchReports}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-blue-500/30 bg-blue-500/10 px-6 py-12 text-center">
          <p className="text-white/70">No reported posts to moderate</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-custom">
          {reports.map(report => (
            <div
              key={report.id}
              className="rounded-2xl border border-blue-500/20 bg-[#001a4d]/60 p-4 transition hover:border-blue-400/50 hover:bg-blue-500/20 cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white/70">Posted by</p>
                    <p className="font-semibold text-white truncate">{report.postAuthor}</p>
                  </div>
                  <div className={`rounded-lg border px-3 py-1 text-xs font-semibold whitespace-nowrap ${getViolationColor(report.category)}`}>
                    {report.category.replace('_', ' ')}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-white/70 mb-1">Post content</p>
                  <p className="text-white/90 text-sm line-clamp-2">{report.postBody}</p>
                </div>

                {report.attachments.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {report.attachments.map(att => (
                      <div key={att.id} className="rounded-lg overflow-hidden border border-blue-500/20">
                        {att.contentType.startsWith('image/') ? (
                          <img
                            src={att.url || undefined}
                            alt={att.filename}
                            className="w-full h-24 object-cover"
                          />
                        ) : (
                          <div className="w-full h-24 bg-blue-500/20 flex items-center justify-center">
                            <span className="text-xs text-white/60 text-center px-2">{att.filename}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2">
                  <p className="text-xs font-medium text-white/60">Report reason</p>
                  <p className="text-white/80 text-sm">{report.reason || 'No reason provided'}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-blue-500/10">
                  <p className="text-xs text-white/50">Reported by {report.reportedBy}</p>
                  <p className="text-xs text-white/50">{new Date(report.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReport && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-blue-500/20 bg-[#002459]/90 p-8 shadow-[0_18px_40px_rgba(0,36,89,0.55)] backdrop-blur-xl space-y-6 max-h-[90vh] overflow-y-auto">
            <header className="space-y-2">
              <h3 className="text-2xl font-semibold text-white">Review & Delete Post</h3>
              <p className="text-sm text-white/70">Posted by <span className="font-medium text-white">{selectedReport.postAuthor}</span></p>
            </header>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Post Content</p>
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3">
                  <p className="text-white/90">{selectedReport.postBody}</p>
                </div>
              </div>

              {selectedReport.attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Attachments</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {selectedReport.attachments.map(att => (
                      <div key={att.id} className="rounded-lg overflow-hidden border border-blue-500/20">
                        {att.contentType.startsWith('image/') ? (
                          <img
                            src={att.url || undefined}
                            alt={att.filename}
                            className="w-full h-32 object-cover"
                          />
                        ) : (
                          <div className="w-full h-32 bg-blue-500/20 flex items-center justify-center">
                            <span className="text-xs text-white/60 text-center px-2">{att.filename}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Violation Category</p>
                  <div className={`rounded-lg border px-4 py-3 ${getViolationColor(selectedReport.category)}`}>
                    <p className="font-medium capitalize">{selectedReport.category.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Reported By</p>
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3">
                    <p className="text-white font-medium">{selectedReport.reportedBy}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Report Reason</p>
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3">
                  <p className="text-white/90 text-sm">{selectedReport.reason || 'No reason provided'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Custom Reason (Optional)</p>
                <textarea
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="Add a custom reason to send to the author (optional)"
                  className="w-full rounded-lg border border-blue-500/20 bg-[#001a4d]/60 px-4 py-3 text-white placeholder-white/40 focus:border-blue-400/50 focus:outline-none focus:ring-0 resize-none"
                  rows={3}
                />
                <p className="text-xs text-white/50">
                  If empty, the author will receive the default Community Guidelines message.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-blue-500/10">
              <button
                type="button"
                onClick={() => {
                  setSelectedReport(null);
                  setCustomReason('');
                }}
                className="flex-1 rounded-2xl border border-blue-500/20 px-5 py-3 font-semibold text-white/80 transition hover:border-blue-400/50 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePost}
                disabled={deleting}
                className="flex-1 rounded-2xl border border-red-500/30 bg-red-500/20 px-5 py-3 font-semibold text-red-300 transition hover:border-red-400 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
