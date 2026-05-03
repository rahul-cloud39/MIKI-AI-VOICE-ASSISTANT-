import React, { useState } from 'react';
import './App.css';
import VoiceAssistant from './components/VoiceAssistant';
import RAGUpload from './components/RAG/RAGUpload';
import WebSearch from './components/WebSearch/WebSearch';
import ImageVision from './components/ImageVision/ImageVision';
import Commands from './components/Commands/Commands';
import Analytics from './components/Analytics/Analytics';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { getTranslation } from './utils/i18n';

function AppContent() {
  const { language, updateLanguage, voice, updateVoice } = useLanguage();
  const t = (key) => getTranslation(key, language);
  const [activeTab, setActiveTab] = useState('voice');
  const [stats, setStats] = useState({
    totalInteractions: 0,
    voiceCommands: 0,
    documentsProcessed: 0,
    imagesAnalyzed: 0,
    averageResponseTime: 0,
    topQuestions: [],
    featureUsage: { voice: 0, rag: 0, search: 0, vision: 0, commands: 0 }
  });

  const trackEvent = (feature) => {
    const newStats = { ...stats };
    newStats.totalInteractions += 1;
    newStats.featureUsage[feature] = (newStats.featureUsage[feature] || 0) + 1;
    setStats(newStats);
    localStorage.setItem('miki-analytics', JSON.stringify(newStats));
  };

  const handleEvent = () => {
    trackEvent(activeTab === 'voice' ? 'voice' : activeTab);
  };

  const handleCommandExecute = (result) => {
    trackEvent('commands');
    setStats({
      ...stats,
      voiceCommands: stats.voiceCommands + 1
    });
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>{t('header')}</h1>
        <p>{t('subtitle')}</p>
        
        <div className="header-controls">
          <div className="language-selector">
            <label>{t('language')}</label>
            <select value={language} onChange={(e) => updateLanguage(e.target.value)}>
              <option value="en">{t('english')}</option>
              <option value="hi">{t('hindi')}</option>
            </select>
          </div>

          <div className="voice-selector">
            <label>{t('selectVoice')}</label>
            <select value={voice} onChange={(e) => updateVoice(e.target.value)}>
              <option value="female">{t('femaleVoice')}</option>
              <option value="male">{t('maleVoice')}</option>
            </select>
          </div>
        </div>
      </header>

      <nav className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'voice' ? 'active' : ''}`}
          onClick={() => setActiveTab('voice')}
        >
          {t('voiceChat')}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rag' ? 'active' : ''}`}
          onClick={() => setActiveTab('rag')}
        >
          {t('documentAI')}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          {t('webSearch')}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'vision' ? 'active' : ''}`}
          onClick={() => setActiveTab('vision')}
        >
          {t('imageAnalysis')}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'commands' ? 'active' : ''}`}
          onClick={() => setActiveTab('commands')}
        >
          {t('commands')}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          {t('analytics')}
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'voice' && <VoiceAssistant onEvent={handleEvent} />}
        {activeTab === 'rag' && <RAGUpload onUploadSuccess={() => trackEvent('rag')} onQuery={handleEvent} />}
        {activeTab === 'search' && <WebSearch onSearchComplete={handleEvent} />}
        {activeTab === 'vision' && <ImageVision onAnalysisComplete={handleEvent} />}
        {activeTab === 'commands' && <Commands onCommandExecute={handleCommandExecute} />}
        {activeTab === 'analytics' && <Analytics />}
      </main>

      <footer className="app-footer">
        <p>MIKI v2.0 | Multi-language | Voice Commands | Advanced AI</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
