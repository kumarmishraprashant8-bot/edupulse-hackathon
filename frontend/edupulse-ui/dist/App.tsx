import { useState } from 'react';
import TeacherChat from './components/TeacherChat';
import DietDashboard from './components/DietDashboard';
import LfaWizard from './components/LfaWizard';
import Settings from './components/Settings';
import { ToastContainer } from './components/Toast';

type View = 'teacher' | 'diet' | 'lfa';

function App() {
  const [currentView, setCurrentView] = useState<View>('teacher');
  const [showSettings, setShowSettings] = useState(false);
  const [mockMode, setMockMode] = useState(() => {
    return localStorage.getItem('mockMode') === 'true';
  });
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="gradient-header shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-xl p-2">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">EduPulse</h1>
                <span className="text-sm text-primary-100">Teacher Support Platform</span>
              </div>
            </div>
            <nav className="flex items-center space-x-2">
              {mockMode && (
                <span className="px-3 py-1 bg-accent-500/20 text-accent-100 text-xs font-semibold rounded-full border border-accent-400/30">
                  MOCK MODE
                </span>
              )}
              <button
                onClick={() => setCurrentView('teacher')}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  currentView === 'teacher'
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                    : 'text-primary-100 hover:bg-white/10'
                }`}
                aria-label="Teacher Chat"
              >
                Teacher Chat
              </button>
              <button
                onClick={() => setCurrentView('diet')}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  currentView === 'diet'
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                    : 'text-primary-100 hover:bg-white/10'
                }`}
                aria-label="DIET Dashboard"
              >
                DIET Dashboard
              </button>
              <button
                onClick={() => setCurrentView('lfa')}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  currentView === 'lfa'
                    ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm'
                    : 'text-primary-100 hover:bg-white/10'
                }`}
                aria-label="LFA Wizard"
              >
                LFA Wizard
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 text-white hover:bg-white/10 rounded-xl transition-all"
                aria-label="Settings"
              >
                ⚙️
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'teacher' && <TeacherChat mockMode={mockMode} onToast={showToast} />}
        {currentView === 'diet' && <DietDashboard mockMode={mockMode} onToast={showToast} />}
        {currentView === 'lfa' && <LfaWizard mockMode={mockMode} onToast={showToast} />}
      </main>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          mockMode={mockMode}
          onMockModeChange={(value) => {
            setMockMode(value);
            localStorage.setItem('mockMode', value.toString());
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
