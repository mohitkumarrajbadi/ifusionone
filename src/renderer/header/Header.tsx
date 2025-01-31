import React from 'react';
import './Header.css';

const Header: React.FC = () => {
    
  const sendFrameAction = (action: string) => {
    window.electron.sendFrameAction(action);
  };

  return (
    <header className="header">
      <div className="header-controls">
        <button id="close" onClick={() => sendFrameAction('CLOSE')} className="header-button close-btn"></button>
        <button id="minimize" onClick={() => sendFrameAction('MINIMIZE')} className="header-button minimize-btn"></button>
        <button id="maximize" onClick={() => sendFrameAction('MAXIMIZE')} className="header-button maximize-btn"></button>
      </div>
      <div className="header-title">iFusion One</div>
    </header>
  );
};

export default Header;
