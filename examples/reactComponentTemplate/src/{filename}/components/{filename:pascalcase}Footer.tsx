import React, { useState } from 'react';
import { use${filename:pascalcase} } from '../context';
import { ${filename:pascalcase}Theme } from '../types';

interface ${filename:pascalcase}FooterProps {}

/**
 * Footer component for ${filename:pascalcase}
 */
export const ${filename:pascalcase}Footer: React.FC<${filename:pascalcase}FooterProps> = () => {
  const { data } = use${filename:pascalcase}();
  const [theme, setTheme] = useState<${filename:pascalcase}Theme>(${filename:pascalcase}Theme.SYSTEM);
  
  const handleThemeChange = (newTheme: ${filename:pascalcase}Theme) => {
    setTheme(newTheme);
    // Implementation would apply theme changes to the component
  };

  return (
    <footer className="${filename:kebabcase}-footer">
      <div className="${filename:kebabcase}-footer-left">
        <span className="${filename:kebabcase}-footer-count">
          {data.length} ${filename:lowercase} items
        </span>
        <span className="${filename:kebabcase}-footer-version">
          v${counter:start=1:padding=1}.${counter:start=0:padding=1}.${counter:start=0:padding=1}
        </span>
      </div>
      
      <div className="${filename:kebabcase}-footer-right">
        <div className="${filename:kebabcase}-theme-selector">
          <button 
            className={`${filename:kebabcase}-theme-button ${theme === ${filename:pascalcase}Theme.LIGHT ? '${filename:kebabcase}-theme-button-active' : ''}`}
            onClick={() => handleThemeChange(${filename:pascalcase}Theme.LIGHT)}
            aria-label="Light theme"
            title="Light theme"
          >
            ☀️
          </button>
          <button 
            className={`${filename:kebabcase}-theme-button ${theme === ${filename:pascalcase}Theme.DARK ? '${filename:kebabcase}-theme-button-active' : ''}`}
            onClick={() => handleThemeChange(${filename:pascalcase}Theme.DARK)}
            aria-label="Dark theme"
            title="Dark theme"
          >
            🌙
          </button>
          <button 
            className={`${filename:kebabcase}-theme-button ${theme === ${filename:pascalcase}Theme.SYSTEM ? '${filename:kebabcase}-theme-button-active' : ''}`}
            onClick={() => handleThemeChange(${filename:pascalcase}Theme.SYSTEM)}
            aria-label="System theme"
            title="System theme"
          >
            💻
          </button>
        </div>
      </div>
    </footer>
  );
};