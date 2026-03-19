import { useTheme } from '../providers/ThemeProvider';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  danger?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  isLoading = false,
  danger = true
}: DeleteConfirmationModalProps) {
  const { theme } = useTheme();
  const isLightMode = theme === 'light';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div
        className="fixed inset-0 bg-black/30"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div className={`relative rounded-2xl shadow-2xl max-w-md w-full mx-4 border p-8 space-y-6 ${
        isLightMode
          ? 'bg-white border-slate-200'
          : 'bg-slate-900 border-slate-700'
      }`}>
        {/* Icon */}
        <div className="flex justify-center">
          <div className={`text-5xl rounded-full p-4 ${
            danger
              ? isLightMode
                ? 'bg-red-100 text-red-600'
                : 'bg-red-900/30 text-red-400'
              : isLightMode
              ? 'bg-amber-100 text-amber-600'
              : 'bg-amber-900/30 text-amber-400'
          }`}>
            🗑️
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-2">
          <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            {title}
          </h2>
          <p className={`text-base ${isLightMode ? 'text-slate-600' : 'text-slate-400'}`}>
            {message}
          </p>
          {itemName && (
            <p className={`text-sm font-semibold px-3 py-2 rounded-lg inline-block ${
              isLightMode
                ? 'bg-slate-100 text-slate-700'
                : 'bg-slate-800 text-slate-300'
            }`}>
              {itemName}
            </p>
          )}
        </div>

        {/* Warning */}
        <div className={`rounded-lg p-4 text-sm ${
          danger
            ? isLightMode
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-red-900/20 border border-red-500/30 text-red-300'
            : isLightMode
            ? 'bg-amber-50 border border-amber-200 text-amber-700'
            : 'bg-amber-900/20 border border-amber-500/30 text-amber-300'
        }`}>
          <p className="font-semibold mb-1">⚠️ This action cannot be undone</p>
          <p>Once deleted, this item and all associated data will be permanently removed.</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
              isLightMode
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50'
                : 'bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50'
            }`}
          >
            Keep It
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
              danger
                ? isLightMode
                  ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                  : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50'
                : isLightMode
                ? 'bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50'
                : 'bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50'
            }`}
          >
            {isLoading ? '🔄 Deleting...' : '🗑️ Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
