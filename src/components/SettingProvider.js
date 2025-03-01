import React, { useState, useEffect, createContext, useContext } from 'react';
import './UniversalStyleSwitches.css';

// Create a context for theme and font settings
const UniversalSettingsContext = createContext({
  darkMode: false,
  fontSize: 'normal',
  toggleDarkMode: () => {},
  changeFontSize: () => {}
});

export const UniversalSettingsProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState('normal');

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkModeState = !darkMode;
    setDarkMode(newDarkModeState);
    
    // Apply to body and update local storage
    document.body.classList.toggle('dark-mode', newDarkModeState);
    localStorage.setItem('darkMode', JSON.stringify(newDarkModeState));
  };

  // Change font size
  const changeFontSize = (size) => {
    setFontSize(size);
    document.body.classList.remove('font-normal', 'font-large');
    document.body.classList.add(`font-${size}`);
    localStorage.setItem('fontSize', size);
  };

  // Load saved preferences on component mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    const savedFontSize = localStorage.getItem('fontSize');

    if (savedDarkMode !== null) {
      const isDarkMode = JSON.parse(savedDarkMode);
      setDarkMode(isDarkMode);
      document.body.classList.toggle('dark-mode', isDarkMode);
    }

    if (savedFontSize) {
      setFontSize(savedFontSize);
      document.body.classList.add(`font-${savedFontSize}`);
    }
  }, []);

  return (
    <UniversalSettingsContext.Provider 
      value={{ 
        darkMode, 
        fontSize, 
        toggleDarkMode, 
        changeFontSize 
      }}
    >
      {children}
    </UniversalSettingsContext.Provider>
  );
};

// Custom hook for using universal settings
export const useUniversalSettings = () => {
  const context = useContext(UniversalSettingsContext);
  if (context === undefined) {
    throw new Error('useUniversalSettings must be used within a UniversalSettingsProvider');
  }
  return context;
};

// Universal Settings Component
export const UniversalStyleSwitches=()=> {
  const { darkMode, toggleDarkMode, fontSize, changeFontSize } = useUniversalSettings();

  return (
    <div className="universal-settings-container">
      {/* Dark Mode Switch */}
      <div className="setting-switch">
        <label htmlFor="dark-mode-toggle">
          Dark Mode
          <input 
            type="checkbox" 
            id="dark-mode-toggle"
            checked={darkMode}
            onChange={toggleDarkMode}
            className="toggle-switch"
          />
          <span className="slider"></span>
        </label>
      </div>

      {/* Font Size Switch */}
      <div className="setting-switch">
        <label>
          Font Size&nbsp;
          <select 
            value={fontSize} 
            onChange={(e) => changeFontSize(e.target.value)}
          >
            <option value="normal">Normal</option>
            <option value="large">Large</option>
          </select>
        </label>
      </div>
    </div>
  );
}