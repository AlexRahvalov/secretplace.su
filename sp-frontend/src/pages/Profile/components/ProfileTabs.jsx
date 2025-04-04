import React from 'react';
import './ProfileTabs.css';

const ProfileTabs = ({ activeTab, onTabChange }) => {
  return (
    <div className="profile-tabs">
      <button 
        className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
        onClick={() => onTabChange('info')}
      >
        Основная информация
      </button>
      <button 
        className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
        onClick={() => onTabChange('settings')}
      >
        Настройки
      </button>
    </div>
  );
};

export default ProfileTabs; 