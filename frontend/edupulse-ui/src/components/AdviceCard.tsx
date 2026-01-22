import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { teacherApi, dietApi, downloadModule, ModuleGenerateResponse, ApiResponse } from '../lib/api';
import { set } from 'idb-keyval';

interface AdviceCardProps {
  advice: string;
  moduleLink?: string;
  topic?: string;
  queryId?: string;
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface RequestModuleModalProps {
  topic: string;
  onConfirm: (grade: string, language: string) => void;
  onCancel: () => void;
}

function RequestModuleModal({ topic, onConfirm, onCancel }: RequestModuleModalProps) {
  const [grade, setGrade] = useState('Grade 3');
  const [language, setLanguage] = useState('English');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">Request Module</h3>
        <p className="text-gray-600 mb-4">Generate a micro-module for: <strong>{topic}</strong></p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="input-field"
            >
              <option>Grade 1</option>
              <option>Grade 2</option>
              <option>Grade 3</option>
              <option>Grade 4</option>
              <option>Grade 5</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input-field"
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Telugu</option>
              <option>Marathi</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={() => onConfirm(grade, language)} className="btn-primary flex-1">
            Generate
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdviceCard({ advice, moduleLink, topic, queryId, onToast }: AdviceCardProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [generatingModule, setGeneratingModule] = useState(false);
  const [moduleDownloadUrl, setModuleDownloadUrl] = useState<string | null>(null);
  const [showSimilarQueries, setShowSimilarQueries] = useState(false);
  const [similarCount, setSimilarCount] = useState<number | null>(null);

  // Parse advice into structured format
  const parseAdvice = (adviceText: string) => {
    // Extract numbered steps
    const stepLines = adviceText.split('\n').filter(line => /^\d+\./.test(line.trim()));
    const steps = stepLines.map(line => line.replace(/^\d+\.\s*/, '').trim()).slice(0, 4);
    
    // Extract script (look for quoted text or "script" keyword)
    const scriptMatch = adviceText.match(/"([^"]+)"/) || 
                       adviceText.match(/script[:\-]?\s*(.+?)(?:\n|$)/i);
    const script = scriptMatch ? scriptMatch[1] : null;
    
    return { steps, script };
  };

  const { steps, script } = parseAdvice(advice);

  const handleCopyScript = async () => {
    if (script) {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onToast?.('Script copied to clipboard!', 'success');
    }
  };

  const handleSaveNote = async () => {
    try {
      const notes = await import('idb-keyval').then(m => m.get<Array<any>>('teacherNotes')) || [];
      const newNote = {
        id: Date.now().toString(),
        advice,
        topic: topic || 'general',
        savedAt: new Date().toISOString(),
        queryId,
      };
      notes.push(newNote);
      await set('teacherNotes', notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onToast?.('Note saved!', 'success');
    } catch (err) {
      onToast?.('Failed to save note', 'error');
    }
  };

  const handleFlagToCrp = async () => {
    if (!queryId) {
      onToast?.('Cannot flag: query ID missing', 'error');
      return;
    }

    try {
      const result = await teacherApi.flagToCrp(queryId, 'Teacher flagged for CRP follow-up');
      if (result.ok) {
        onToast?.('Flag sent to CRP', 'success');
      } else {
        onToast?.('Failed to flag. Please try again.', 'error');
      }
    } catch (err) {
      onToast?.('Failed to flag. Please try again.', 'error');
    }
  };

  const handleRequestModule = async (grade: string, language: string) => {
    setShowModuleModal(false);
    setGeneratingModule(true);

    try {
      if (!topic) {
        onToast?.('Topic not available for module generation', 'error');
        return;
      }

      const result = await dietApi.generateModule({
        cluster: 'Default Cluster',
        topic,
        grade,
        language,
      });

      if (result.ok && result.data) {
        // Download the module
        try {
          await downloadModule(result.data);
          setModuleDownloadUrl(result.data.pptx_link || '');
          onToast?.('Module downloaded successfully!', 'success');
        } catch (downloadErr) {
          // If download fails, show link
          setModuleDownloadUrl(result.data.pptx_link || '');
          onToast?.('Module generated! Click to download.', 'info');
        }
      } else {
        onToast?.(result.error || 'Failed to generate module', 'error');
      }
    } catch (err) {
      onToast?.('Failed to generate module. Please try again.', 'error');
    } finally {
      setGeneratingModule(false);
    }
  };

  const handleShowSimilarQueries = async () => {
    if (showSimilarQueries) {
      setShowSimilarQueries(false);
      return;
    }

    try {
      const result = await dietApi.getAggregate(undefined, topic);
      if (result.ok && result.data) {
        const count = result.data.by_topic[topic || ''] || 0;
        setSimilarCount(count);
        setShowSimilarQueries(true);
      }
    } catch (err) {
      onToast?.('Failed to load similar queries', 'error');
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card mt-6 border-2 border-primary-200 shadow-xl"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-bold text-primary-700 mb-1">
              Try this in the next 10 minutes
            </h3>
            {topic && (
              <span className="text-sm text-accent-600 font-medium bg-accent-50 px-3 py-1 rounded-full">
                {topic.replace(/-/g, ' ')}
              </span>
            )}
          </div>
        </div>

        {/* Action Steps */}
        <div className="mb-6">
          {steps.length > 0 ? (
            <ul className="space-y-3 list-none">
              {steps.map((step, idx) => (
                <motion.li
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start"
                >
                  <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold mr-3 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700 text-lg leading-relaxed">{step}</span>
                </motion.li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">{advice}</p>
          )}
        </div>

        {/* Teacher Script (Copyable) */}
        {script && (
          <div className="bg-accent-50 border-l-4 border-accent-500 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-accent-800">💬 Teacher script</p>
              <button
                onClick={handleCopyScript}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-accent-700 hover:bg-accent-100'
                }`}
                aria-label="Copy script"
              >
                {copied ? '✓ Copied' : 'Copy script'}
              </button>
            </div>
            <p className="text-accent-700 italic font-medium">{script}</p>
          </div>
        )}

        {/* Micro-learning Card */}
        <div className="bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-200 rounded-lg p-4 mb-4">
          <h4 className="font-bold text-primary-800 mb-2">📚 Quick Learning (30-60 seconds)</h4>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            {steps.slice(0, 2).map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ul>
          {script && (
            <p className="text-xs text-gray-600 mt-2 italic">Read aloud: "{script}"</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleCopyScript}
            className="btn-secondary text-sm"
            aria-label="Copy script"
            disabled={!script}
          >
            {copied ? '✓ Copied' : '📋 Copy script'}
          </button>
          <button
            onClick={handleSaveNote}
            className="btn-secondary text-sm"
            aria-label="Save note"
          >
            {saved ? '✓ Saved' : '💾 Save note'}
          </button>
          <button
            onClick={handleFlagToCrp}
            className="btn-secondary text-sm"
            aria-label="Flag to CRP"
            disabled={!queryId}
          >
            🚩 Flag to CRP
          </button>
          <button
            onClick={() => setShowModuleModal(true)}
            className="btn-secondary text-sm"
            aria-label="Request Module"
            disabled={generatingModule}
          >
            {generatingModule ? '⏳ Generating...' : '📚 Request Module'}
          </button>
          {moduleDownloadUrl && (
            <a
              href={moduleDownloadUrl}
              download
              className="btn-primary text-sm"
              aria-label="Download Module"
            >
              📥 Download Module
            </a>
          )}
          <button
            onClick={handleShowSimilarQueries}
            className="btn-secondary text-sm"
            aria-label="Show similar queries"
          >
            🔍 Show similar queries
          </button>
        </div>

        {/* Similar Queries Info */}
        {showSimilarQueries && similarCount !== null && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>{similarCount}</strong> similar queries found for this topic.
            </p>
          </div>
        )}
      </motion.div>

      {/* Request Module Modal */}
      <AnimatePresence>
        {showModuleModal && (
          <RequestModuleModal
            topic={topic || 'general'}
            onConfirm={handleRequestModule}
            onCancel={() => setShowModuleModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
