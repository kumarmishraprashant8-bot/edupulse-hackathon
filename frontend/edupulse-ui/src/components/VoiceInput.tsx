import { useState, useEffect } from 'react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  const startListening = () => {
    if (!isSupported || disabled) return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className="px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
        title="Voice input not supported in this browser"
        aria-label="Voice input not available"
      >
        🎤
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={startListening}
      disabled={disabled || isListening}
      className={`px-3 py-2 rounded-lg transition-all ${
        isListening
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-accent-100 text-accent-700 hover:bg-accent-200'
      }`}
      aria-label={isListening ? 'Listening...' : 'Start voice input'}
      title={isListening ? 'Listening...' : 'Click to speak'}
    >
      {isListening ? '🔴' : '🎤'}
    </button>
  );
}
