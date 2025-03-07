// Header.tsx
import React, { useEffect, useCallback } from 'react';
import { FaPlus, FaTimes, FaMoon, FaSun } from 'react-icons/fa';
import { useTabs } from '../utils/TabsContext'; // Adjust the path as needed
import './Header.css';

const Header: React.FC = () => {
  const { tabs, activeTab, addTab, closeTab, switchTab, reorderTabs } = useTabs();
  const [draggedTabId, setDraggedTabId] = React.useState<number | null>(null);
  const [darkMode, setDarkMode] = React.useState<boolean>(false);

  // Set theme based on system preference.
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setDarkMode(mediaQuery.matches);
    const handleThemeChange = (e: MediaQueryListEvent) => setDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleThemeChange);
    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, []);

  // Update body class based on dark mode.
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  const toggleTheme = useCallback(() => setDarkMode((prev) => !prev), []);
  const sendFrameAction = useCallback((action: string) => {
    window.electron.sendFrameAction(action);
  }, []);

  const onDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: number) => {
    setDraggedTabId(id);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>, id: number) => {
    e.preventDefault();
    if (draggedTabId === null || draggedTabId === id) return;
    reorderTabs(draggedTabId, id);
    setDraggedTabId(null);
  }, [draggedTabId, reorderTabs]);

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-controls">
          <button id="close" onClick={() => sendFrameAction('CLOSE')} className="header-button close-btn" />
          <button id="minimize" onClick={() => sendFrameAction('MINIMIZE')} className="header-button minimize-btn" />
          <button id="maximize" onClick={() => sendFrameAction('MAXIMIZE')} className="header-button maximize-btn" />
        </div>
      </div>
      <div className="header-center">
        <div className="tabs">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              draggable
              onDragStart={(e) => onDragStart(e, tab.id)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, tab.id)}
              onClick={() => switchTab(tab.id)}
            >
              <span className="tab-title">{tab.title}</span>
              {tab.id !== 0 && (
                <button
                  className="tab-close-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  <FaTimes size={10} />
                </button>
              )}
            </div>
          ))}
          <button className="add-tab-btn" onClick={() => addTab('codeeditor')}>
            <FaPlus size={12} />
          </button>
        </div>
      </div>
      <div className="header-right">
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {darkMode ? <FaSun size={16} /> : <FaMoon size={16} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
