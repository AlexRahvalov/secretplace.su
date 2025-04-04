import React from 'react';
import EmailSettings from './EmailSettings';
import './Settings.css';

const Settings = () => {
  return (
    <div className="settings-container">
      <div className="settings-section">
        <h2>Настройки профиля</h2>
        <EmailSettings />
      </div>
    </div>
  );
};

export default Settings; 