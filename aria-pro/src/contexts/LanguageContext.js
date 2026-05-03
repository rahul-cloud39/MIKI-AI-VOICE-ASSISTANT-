import React, { createContext, useState } from 'react';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('miki-language') || 'en';
  });

  const [voice, setVoice] = useState(() => {
    return localStorage.getItem('miki-voice') || 'female';
  });

  const updateLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('miki-language', lang);
  };

  const updateVoice = (voiceType) => {
    setVoice(voiceType);
    localStorage.setItem('miki-voice', voiceType);
  };

  return (
    <LanguageContext.Provider value={{ language, updateLanguage, voice, updateVoice }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
