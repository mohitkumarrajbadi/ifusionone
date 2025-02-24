import React, { useState } from 'react';
import { FaHome, FaPlus, FaTimes } from 'react-icons/fa';
import './Header.css';

interface Tab {
  id: number;
  title: string;
}

const Header: React.FC = () => {
  // Initial tab: Home (id: 0)
  const [tabs, setTabs] = useState<Tab[]>([{ id: 0, title: 'Home' }]);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [draggedTabId, setDraggedTabId] = useState<number | null>(null);

  const sendFrameAction = (action: string) => {
    window.electron.sendFrameAction(action);
  };

  // Adds a new tab.
  const addTab = async () => {
    console.log("Inside Add Tab");
    // Calculate new id.
    const newId = tabs.length ? Math.max(...tabs.map(tab => tab.id)) + 1 : 0;
    const newTab: Tab = { id: newId, title: `Tab ${newId}` };
    setTabs([...tabs, newTab]);
    setActiveTab(newId);
    // Tell main process to add and switch to the new tab.
    await window.electron.addTab('testing');
    await window.electron.switchTab(newId);
  };

  // Closes a tab by id.
  const closeTab = async (id: number) => {
    // Prevent closing the Home tab.
    if (id === 0) return;
    if (tabs.length === 1) return; // Prevent closing the last remaining tab.
    setTabs(tabs.filter(tab => tab.id !== id));
    if (activeTab === id) {
      const newActive = tabs.find(tab => tab.id !== id)?.id ?? 0;
      setActiveTab(newActive);
      await window.electron.switchTab(newActive);
    }
    await window.electron.closeTab(id);
  };

  // When a tab is clicked, make it active.
  const handleTabClick = async (id: number) => {
    console.log('Clicked tab id:', id);
    setActiveTab(id);
    await window.electron.switchTab(id);
  };

  // Drag handlers for reordering.
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    setDraggedTabId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, id: number) => {
    e.preventDefault();
    if (draggedTabId === null || draggedTabId === id) return;
    const draggedIndex = tabs.findIndex(tab => tab.id === draggedTabId);
    const dropIndex = tabs.findIndex(tab => tab.id === id);
    const updatedTabs = Array.from(tabs);
    const [removed] = updatedTabs.splice(draggedIndex, 1);
    updatedTabs.splice(dropIndex, 0, removed);
    setTabs(updatedTabs);
    setDraggedTabId(null);
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-controls">
          <button
            id="close"
            onClick={() => sendFrameAction('CLOSE')}
            className="header-button close-btn"
          ></button>
          <button
            id="minimize"
            onClick={() => sendFrameAction('MINIMIZE')}
            className="header-button minimize-btn"
          ></button>
          <button
            id="maximize"
            onClick={() => sendFrameAction('MAXIMIZE')}
            className="header-button maximize-btn"
          ></button>
        </div>
      </div>
      <div className="header-center">
        <div className="tabs">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={(e) => handleDragOver(e, tab.id)}
              onDrop={(e) => handleDrop(e, tab.id)}
              onClick={() => handleTabClick(tab.id)}
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
          <button className="add-tab-btn" onClick={addTab}>
            <FaPlus size={12} />
          </button>
        </div>
      </div>
      <div className="header-right">
        {/* Reserved for future controls */}
      </div>
    </header>
  );
};

export default Header;
