import React, { useState } from 'react';
import './App.css';
import WebChat from './components/WebChat';
import Dashboard from './components/Dashboard';
import LFAWizard from './components/LFAWizard';

function App() {
  const [activeTab, setActiveTab] = useState('chat');

  return (
    <div className="App">
      <nav style={styles.navbar}>
        <div style={styles.navBrand}>
          <span style={styles.logo}>🎓</span>
          <h1 style={styles.title}>EduPulse</h1>
        </div>
        <div style={styles.navTabs}>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              ...styles.tab,
              ...(activeTab === 'chat' ? styles.activeTab : {}),
            }}
          >
            Teacher Chat
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              ...styles.tab,
              ...(activeTab === 'dashboard' ? styles.activeTab : {}),
            }}
          >
            DIET Dashboard
          </button>
          <button
            onClick={() => setActiveTab('lfa')}
            style={{
              ...styles.tab,
              ...(activeTab === 'lfa' ? styles.activeTab : {}),
            }}
          >
            LFA Wizard
          </button>
        </div>
      </nav>

      <main style={styles.main}>
        {activeTab === 'chat' && <WebChat />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'lfa' && <LFAWizard />}
      </main>

      <footer style={styles.footer}>
        <p>EduPulse v1.0.0 | Apache 2.0 License | Built for teachers and DIET officers</p>
      </footer>
    </div>
  );
}

const styles = {
  navbar: {
    backgroundColor: '#1976D2',
    color: 'white',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logo: {
    fontSize: '32px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
  },
  navTabs: {
    display: 'flex',
    gap: '10px',
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: 'white',
    border: '2px solid transparent',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.3s',
  },
  activeTab: {
    backgroundColor: 'white',
    color: '#1976D2',
  },
  main: {
    minHeight: 'calc(100vh - 140px)',
  },
  footer: {
    backgroundColor: '#333',
    color: 'white',
    textAlign: 'center',
    padding: '20px',
    fontSize: '14px',
  },
};

export default App;