import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getTranslation } from '../../utils/i18n';
import { commandProcessor } from '../../utils/CommandProcessor';
import './Commands.css';

export default function Commands({ onCommandExecute }) {
  const { language } = useLanguage();
  const t = (key) => getTranslation(key, language);

  commandProcessor.getAvailableCommands();

  return (
    <div className="commands-container">
      <h3>{t('commandSystem')}</h3>

      <div className="commands-info">
        <p>Try saying voice commands or typing them below:</p>
      </div>

      <div className="commands-grid">
        <div className="command-section">
          <h4>Open Websites</h4>
          <ul>
            <li>Open YouTube</li>
            <li>Open Google</li>
            <li>Open Gmail</li>
            <li>Open GitHub</li>
            <li>Open Twitter</li>
            <li>Open LinkedIn</li>
          </ul>
        </div>

        <div className="command-section">
          <h4>Get Information</h4>
          <ul>
            <li>What time is it?</li>
            <li>What's today's date?</li>
            <li>Hello</li>
          </ul>
        </div>
      </div>

      <div className="command-input-section">
        <input
          type="text"
          placeholder="Type a command..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const result = commandProcessor.processCommand(e.target.value);
              if (result.executed) {
                onCommandExecute?.(result);
                e.target.value = '';
              }
            }
          }}
          className="command-input"
        />
      </div>

      <div className="command-tips">
        <p>Pro Tip: Use voice commands with the Voice Chat tab!</p>
      </div>
    </div>
  );
}
