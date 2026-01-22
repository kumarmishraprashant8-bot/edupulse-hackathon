import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { teacherApi, TeacherQueryResponse, compressImage, ApiResponse } from '../lib/api';
import { useOfflineFallback } from '../hooks/useOfflineFallback';
import mockData from '../mock/seed.json';
import QuickChips from './QuickChips';
import VoiceInput from './VoiceInput';
import AdviceCard from './AdviceCard';
import { detectTopicFromText } from '../lib/intentMapping';

interface TeacherChatProps {
  mockMode: boolean;
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface ChatMessage {
  id: string;
  text: string;
  timestamp: Date;
  isTeacher: boolean;
}

const QUICK_CHIPS = [
  'Classroom management',
  'Concept confusion',
  'Student absenteeism',
  'Parent engagement',
  'Need TLMs',
];

export default function TeacherChat({ mockMode, onToast }: TeacherChatProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [response, setResponse] = useState<TeacherQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isMockMode, recordFailure, recordSuccess } = useOfflineFallback();
  const effectiveMockMode = mockMode || isMockMode;

  const handleChipClick = (chip: string) => {
    setText(chip);
  };

  const handleVoiceTranscript = (transcript: string) => {
    setText(transcript);
  };

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onToast?.('Please upload an image file (JPG or PNG)', 'error');
      return;
    }

    // Validate and compress file size
    try {
      const maxSizeKB = 500;
      if (file.size > maxSizeKB * 1024) {
        const compressed = await compressImage(file, maxSizeKB, 0.6);
        setAttachment(compressed);
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachmentPreview(e.target?.result as string);
        };
        reader.readAsDataURL(compressed);
        onToast?.('Image compressed to meet size limit', 'info');
      } else {
        setAttachment(file);
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachmentPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      onToast?.('Failed to process image. Please try a different file.', 'error');
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Please describe your classroom problem');
      return;
    }

    // Optimistic update: immediately append teacher message
    const teacherMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      text: text.trim(),
      timestamp: new Date(),
      isTeacher: true,
    };
    setMessages((prev) => [...prev, teacherMessage]);

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let result: TeacherQueryResponse;

      if (effectiveMockMode) {
        // Use mock data
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const mockQuery = mockData.teacherQueries[0];
        result = {
          id: mockQuery.id,
          advice: mockQuery.advice,
          module_sample_link: mockQuery.module_sample_link,
          consent_required: false,
        };
        recordSuccess();
      } else {
        // Call real API
        const detectedTopic = detectTopicFromText(text)[0] || 'general';
        const apiResult = await teacherApi.createTeacherQuery({
          text: text.trim(),
          cluster: 'Default Cluster', // Can be made configurable later
          topic: detectedTopic,
          attachment: attachment || undefined,
          is_demo: !attachment && !text.includes('@'), // Simple demo detection
        });

        if (apiResult.ok && apiResult.data) {
          result = apiResult.data;
          recordSuccess();
        } else {
          // Record failure and check if we should fallback
          recordFailure();
          if (isMockMode) {
            // Already in mock mode, use mock data
            const mockQuery = mockData.teacherQueries[0];
            result = {
              id: mockQuery.id,
              advice: mockQuery.advice,
              module_sample_link: mockQuery.module_sample_link,
              consent_required: false,
            };
            onToast?.('Offline demo mode — using cached responses.', 'info');
          } else {
            throw new Error(apiResult.error || 'Failed to get advice');
          }
        }
      }

      setResponse(result);
      onToast?.('Advice generated successfully!', 'success');
      // Clear input and attachment
      setText('');
      setAttachment(null);
      setAttachmentPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to submit query. Please try again.';
      setError(errorMsg);
      recordFailure();

      // Final fallback to mock data if not already in mock mode
      if (!effectiveMockMode) {
        try {
          const mockQuery = mockData.teacherQueries[0];
          setResponse({
            id: mockQuery.id,
            advice: mockQuery.advice,
            module_sample_link: mockQuery.module_sample_link,
            consent_required: false,
          });
          setError('We can\'t reach the server. Retry / Use offline demo');
          onToast?.('Using offline demo mode', 'info');
        } catch {
          onToast?.('Failed to load advice. Please try again.', 'error');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section - Chat-first */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6 bg-gradient-to-r from-primary-50 to-accent-50 border-2 border-primary-200"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Teacher Chat — quick help in the classroom</h2>
        <p className="text-gray-600 text-lg">Get immediate, actionable advice for your classroom challenges.</p>
        {(effectiveMockMode || isMockMode) && (
          <div className="mt-3 px-4 py-2 bg-accent-100 border border-accent-300 rounded-lg">
            <p className="text-sm text-accent-800 font-medium">
              {isMockMode ? 'Offline demo mode — using cached responses.' : '🧪 Mock Mode Active — Using demo data'}
            </p>
          </div>
        )}
      </motion.div>

      {/* Chat Messages */}
      <div className="card mb-4 min-h-[300px] max-h-[500px] overflow-y-auto">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-4 flex ${msg.isTeacher ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.isTeacher
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.isTeacher ? 'text-primary-100' : 'text-gray-500'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Skeleton (left side where answer will appear) */}
        {loading && !response && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start mb-4"
          >
            <div className="max-w-[75%] bg-gray-100 rounded-2xl px-4 py-3 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="card">
        {/* Quick Chips */}
        <div className="mb-4">
          <QuickChips suggestions={QUICK_CHIPS} onSelect={handleChipClick} />
        </div>

        {/* Attachment Preview */}
        {attachmentPreview && (
          <div className="mb-4 relative inline-block">
            <img
              src={attachmentPreview}
              alt="Attachment preview"
              className="max-w-[200px] max-h-[200px] rounded-lg border-2 border-gray-200"
            />
            <button
              type="button"
              onClick={removeAttachment}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
              aria-label="Remove attachment"
            >
              ×
            </button>
          </div>
        )}

        {/* Input Row */}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="input-field pr-20"
              placeholder="Describe the classroom problem in one sentence (e.g., 'Students confused about subtraction borrowing')"
              aria-label="Describe classroom problem"
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleAttachmentChange}
                disabled={loading}
                className="hidden"
                id="attachment-input"
                aria-label="Upload image attachment"
              />
              <label
                htmlFor="attachment-input"
                className="cursor-pointer p-2 text-gray-600 hover:text-primary-600 transition-colors"
                title="Upload image (max 500KB)"
              >
                📎
              </label>
              <VoiceInput onTranscript={handleVoiceTranscript} disabled={loading} />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !text.trim()}
            className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              '✈️'
            )}
          </button>
        </div>
      </form>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card mt-4 bg-red-50 border-2 border-red-200"
          >
            <p className="text-red-700 font-medium">{error}</p>
            {error.includes("can't reach") && (
              <button
                onClick={() => {
                  setError(null);
                  // Retry logic could go here
                }}
                className="mt-2 text-sm text-red-600 underline"
              >
                Retry
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Response Card */}
      <AnimatePresence>
        {response && (
          <AdviceCard
            advice={response.advice}
            moduleLink={response.module_sample_link}
            queryId={response.id}
            topic={detectTopicFromText(messages[messages.length - 1]?.text || '')[0]}
            onToast={onToast}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
