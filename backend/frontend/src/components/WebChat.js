import React, { useState } from 'react';
import { submitTeacherQuery } from '../services/api';

const WebChat = () => {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Welcome to EduPulse! How can I help you today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [phone, setPhone] = useState('');
  const [cluster, setCluster] = useState('Cluster A');
  const [loading, setLoading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!inputText.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { type: 'user', text: inputText }]);
    setLoading(true);

    try {
      const response = await submitTeacherQuery({
        phone: phone || '+919876543210',
        cluster: cluster,
        topic: 'general',
        text: inputText,
        consent_given: consentGiven
      });

      // Add bot response
      const botMessage = {
        type: 'bot',
        text: response.advice,
        link: response.module_sample_link,
        consentRequired: response.consent_required
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      if (response.consent_required) {
        setConsentGiven(false);
      } else {
        setConsentGiven(true);
      }
      
      setInputText('');
    } catch (error) {
      setMessages(prev => [...prev, {
        type: 'bot',
        text: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Teacher Chat</h2>
        <p style={styles.subtitle}>Get immediate classroom support</p>
      </div>

      <div style={styles.setupPanel}>
        <input
          type="text"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={styles.setupInput}
        />
        <select
          value={cluster}
          onChange={(e) => setCluster(e.target.value)}
          style={styles.setupInput}
        >
          <option>Cluster A</option>
          <option>Cluster B</option>
          <option>Cluster C</option>
        </select>
      </div>

      <div style={styles.chatBox}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              ...styles.message,
              ...(msg.type === 'user' ? styles.userMessage : styles.botMessage)
            }}
          >
            <div style={styles.messageText}>{msg.text}</div>
            {msg.link && (
              <a
                href={`http://localhost:8000${msg.link}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
              >
                📹 Watch Demo
              </a>
            )}
            {msg.consentRequired && (
              <button
                onClick={() => {
                  setConsentGiven(true);
                  setInputText('YES');
                }}
                style={styles.consentButton}
              >
                I consent - Continue
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div style={styles.loading}>Thinking...</div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={styles.inputForm}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Describe your classroom challenge..."
          style={styles.input}
          disabled={loading}
        />
        <button
          type="submit"
          style={styles.sendButton}
          disabled={loading || !inputText.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '20px',
    textAlign: 'center',
  },
  subtitle: {
    margin: '5px 0 0 0',
    fontSize: '14px',
    opacity: 0.9,
  },
  setupPanel: {
    padding: '10px',
    backgroundColor: 'white',
    borderBottom: '1px solid #ddd',
    display: 'flex',
    gap: '10px',
  },
  setupInput: {
    flex: 1,
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  chatBox: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '12px',
    maxWidth: '70%',
    wordWrap: 'break-word',
  },
  userMessage: {
    backgroundColor: '#2196F3',
    color: 'white',
    alignSelf: 'flex-end',
    marginLeft: 'auto',
  },
  botMessage: {
    backgroundColor: 'white',
    color: '#333',
    alignSelf: 'flex-start',
    border: '1px solid #ddd',
  },
  messageText: {
    whiteSpace: 'pre-wrap',
  },
  link: {
    display: 'inline-block',
    marginTop: '8px',
    color: '#2196F3',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
  consentButton: {
    marginTop: '10px',
    padding: '8px 16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  inputForm: {
    display: 'flex',
    padding: '15px',
    backgroundColor: 'white',
    borderTop: '1px solid #ddd',
  },
  input: {
    flex: 1,
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  sendButton: {
    marginLeft: '10px',
    padding: '12px 24px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
};

export default WebChat;