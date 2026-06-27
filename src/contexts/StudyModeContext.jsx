import React, { createContext, useContext, useState, useEffect } from 'react';

const StudyModeContext = createContext();

export function StudyModeProvider({ children }) {
  const [isStudyMode, setIsStudyMode] = useState(() => {
    return localStorage.getItem('study-mode') === 'true';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isStudyMode) {
      root.classList.add('study-mode');
    } else {
      root.classList.remove('study-mode');
    }
    localStorage.setItem('study-mode', isStudyMode);
  }, [isStudyMode]);

  const toggleStudyMode = () => setIsStudyMode(prev => !prev);

  return (
    <StudyModeContext.Provider value={{ isStudyMode, toggleStudyMode }}>
      {children}
    </StudyModeContext.Provider>
  );
}

export const useStudyMode = () => useContext(StudyModeContext);
