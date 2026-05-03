import React, { useState, useEffect } from 'react';
import './Analytics.css';

export default function Analytics() {
  const [stats, setStats] = useState({
    totalInteractions: 0,
    voiceCommands: 0,
    documentsProcessed: 0,
    imagesAnalyzed: 0,
    averageResponseTime: 0,
    topQuestions: [],
    featureUsage: {
      voice: 0,
      rag: 0,
      search: 0,
      vision: 0,
      commands: 0
    }
  });

  useEffect(() => {
    const savedStats = localStorage.getItem('miki-analytics');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  const resetAnalytics = () => {
    const emptyStats = {
      totalInteractions: 0,
      voiceCommands: 0,
      documentsProcessed: 0,
      imagesAnalyzed: 0,
      averageResponseTime: 0,
      topQuestions: [],
      featureUsage: {
        voice: 0,
        rag: 0,
        search: 0,
        vision: 0,
        commands: 0
      }
    };
    setStats(emptyStats);
    localStorage.setItem('miki-analytics', JSON.stringify(emptyStats));
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h3>Analytics Dashboard</h3>
        <button onClick={resetAnalytics} className="reset-btn">Reset Stats</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Interactions</h4>
          <p className="stat-value">{stats.totalInteractions}</p>
        </div>

        <div className="stat-card">
          <h4>Voice Commands</h4>
          <p className="stat-value">{stats.voiceCommands}</p>
        </div>

        <div className="stat-card">
          <h4>Documents Processed</h4>
          <p className="stat-value">{stats.documentsProcessed}</p>
        </div>

        <div className="stat-card">
          <h4>Images Analyzed</h4>
          <p className="stat-value">{stats.imagesAnalyzed}</p>
        </div>

        <div className="stat-card">
          <h4>Avg Response Time</h4>
          <p className="stat-value">{stats.averageResponseTime.toFixed(2)}ms</p>
        </div>

        <div className="stat-card">
          <h4>System Commands Used</h4>
          <p className="stat-value">{stats.featureUsage.commands}</p>
        </div>
      </div>

      <div className="feature-usage">
        <h4>Feature Usage Breakdown</h4>
        <div className="feature-bars">
          <div className="feature-bar">
            <label>Voice Chat</label>
            <div className="bar-container">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.min((stats.featureUsage.voice / (stats.totalInteractions || 1)) * 100, 100)}%`,
                  backgroundColor: '#68d6e2'
                }}
              />
            </div>
            <span>{stats.featureUsage.voice}</span>
          </div>

          <div className="feature-bar">
            <label>Document AI</label>
            <div className="bar-container">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.min((stats.featureUsage.rag / (stats.totalInteractions || 1)) * 100, 100)}%`,
                  backgroundColor: '#7a7fff'
                }}
              />
            </div>
            <span>{stats.featureUsage.rag}</span>
          </div>

          <div className="feature-bar">
            <label>Web Search</label>
            <div className="bar-container">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.min((stats.featureUsage.search / (stats.totalInteractions || 1)) * 100, 100)}%`,
                  backgroundColor: '#4facfe'
                }}
              />
            </div>
            <span>{stats.featureUsage.search}</span>
          </div>

          <div className="feature-bar">
            <label>Image Analysis</label>
            <div className="bar-container">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.min((stats.featureUsage.vision / (stats.totalInteractions || 1)) * 100, 100)}%`,
                  backgroundColor: '#ff7a59'
                }}
              />
            </div>
            <span>{stats.featureUsage.vision}</span>
          </div>

          <div className="feature-bar">
            <label>Commands</label>
            <div className="bar-container">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.min((stats.featureUsage.commands / (stats.totalInteractions || 1)) * 100, 100)}%`,
                  backgroundColor: '#ff6b35'
                }}
              />
            </div>
            <span>{stats.featureUsage.commands}</span>
          </div>
        </div>
      </div>

      {stats.topQuestions.length > 0 && (
        <div className="top-questions">
          <h4>Top Questions Asked</h4>
          <ul>
            {stats.topQuestions.slice(0, 5).map((q, idx) => (
              <li key={idx}>
                <span className="rank">#{idx + 1}</span>
                <span className="question">{q.text}</span>
                <span className="count">{q.count}x</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="analytics-info">
        <p>Analytics are tracked locally and never sent to external servers.</p>
      </div>
    </div>
  );
}
