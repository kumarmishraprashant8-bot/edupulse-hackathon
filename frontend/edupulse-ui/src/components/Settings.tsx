import { useState } from 'react';
import { motion } from 'framer-motion';

interface SettingsProps {
  mockMode: boolean;
  onMockModeChange: (value: boolean) => void;
  onClose: () => void;
}

export default function Settings({ mockMode, onMockModeChange, onClose }: SettingsProps) {
  const [apiUrl, setApiUrl] = useState(() => {
    return localStorage.getItem('apiUrl') || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  });

  const handleSave = () => {
    localStorage.setItem('apiUrl', apiUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <h2 id="settings-title" className="text-2xl font-bold mb-4">Settings</h2>

        <div className="space-y-4">
          <div className="bg-accent-50 border-2 border-accent-200 rounded-xl p-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={mockMode}
                onChange={(e) => onMockModeChange(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                aria-label="Toggle mock mode"
              />
              <div>
                <span className="text-sm font-semibold text-gray-800 block">Mock Mode / Offline Demo</span>
                <p className="text-xs text-gray-600 mt-1">
                  Use mock data from seed.json instead of calling the backend API. Perfect for demos when backend is offline.
                </p>
              </div>
            </label>
            {mockMode && (
              <div className="mt-3 px-3 py-2 bg-accent-100 rounded-lg">
                <p className="text-xs text-accent-800 font-medium">
                  ✓ All network calls will use local mock data
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Backend API URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="input-field"
              placeholder="http://127.0.0.1:8000"
              aria-label="Backend API URL"
            />
            <p className="text-xs text-gray-500 mt-1">
              Only used when Mock Mode is off
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3">
              💡 Tip: Enable Mock Mode for offline demos or when backend is unavailable. All features work with local data.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} className="btn-primary flex-1" aria-label="Save settings">
              Save
            </button>
            <button onClick={onClose} className="btn-secondary" aria-label="Cancel">
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
