import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, getProfileDetails, getProfileActivity, getUserSettings } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ProfileTabs from './components/ProfileTabs';
import Settings from './components/Settings';
import Avatar from '../../components/Profile/Avatar';
import EmailVerificationModal from '../../components/Profile/EmailVerificationModal';
import '@assets/css/pages/Profile.css';

// Импортируем иконки
import emailNotLinked from '@assets/images/email-not-linked.svg';
import emailPending from '@assets/images/email-pending.svg';
import emailVerified from '@assets/images/email-verified.svg';

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [profileDetails, setProfileDetails] = useState(null);
  const [userSettings, setUserSettings] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [profile, details, activityData, settings] = await Promise.all([
          getProfile(),
          getProfileDetails(),
          getProfileActivity(),
          getUserSettings()
        ]);

        setProfileData(profile);
        setProfileDetails(details);
        setActivities(activityData.activities);
        setUserSettings(settings.data);
      } catch (error) {
        console.error('Ошибка загрузки данных профиля:', error);
        setError('Не удалось загрузить данные профиля');
        
        if (error.message.includes('401')) {
          logout();
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [isAuthenticated, navigate, logout]);

  const formatDate = (dateString) => {
    try {
      if (dateString.includes('[')) {
        dateString = dateString.replace(/\[.*?\]/, '');
      }
      
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }

      return date.toLocaleString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Некорректная дата';
    }
  };

  const getActivityType = (type) => {
    const types = {
      login: 'Вход в систему',
      registration: 'Регистрация',
      kicked: 'Отключен от сервера'
    };
    return types[type] || type;
  };

  const getEmailIcon = () => {
    if (!userSettings?.email?.address) {
      return {
        src: emailNotLinked,
        title: 'Email не привязан'
      };
    }
    if (!userSettings.email.verified) {
      return {
        src: emailPending,
        title: 'Email ожидает подтверждения'
      };
    }
    return {
      src: emailVerified,
      title: 'Email подтвержден'
    };
  };

  const handleEmailSuccess = async () => {
    try {
      const settings = await getUserSettings();
      setUserSettings(settings.data);
    } catch (error) {
      console.error('Ошибка обновления настроек:', error);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">Загрузка данных профиля...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab === 'settings') {
      return <Settings />;
    }

    return (
      <>
        {profileData && profileDetails && (
          <div className="profile-section">
            <div className="profile-info">
              <div className="profile-avatar-container">
                <Avatar username={profileData.username} size={128} />
                <div className={`profile-status ${
                  profileDetails.is_online ? 'online' : 'offline'
                }`}>
                  {profileDetails.is_online ? 'В игре' : 'Не в игре'}
                </div>
              </div>
              <div className="profile-details">
                <h2 className="profile-username">{profileData.username}</h2>
                <div className="profile-info-grid">
                  <div className="profile-info-item">
                    <span className="info-label">UUID</span>
                    <span className="info-value uuid">{profileData.uuid}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="info-label">Тип аккаунта</span>
                    <span className={`info-value ${profileDetails.online_account === "TRUE" ? 'licensed' : ''}`}>
                      {profileDetails.online_account === "TRUE" ? 'Лицензионный' : 
                       profileDetails.online_account === "FALSE" ? 'Не лицензионный' : 
                       'Неизвестно'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="profile-section">
          <h2>Привязанные ресурсы</h2>
          <div className="linked-resources">
            <div 
              className="resource-item"
              onClick={() => setIsEmailModalOpen(true)}
              style={{ cursor: 'pointer' }}
            >
              <div className="resource-icon" title={getEmailIcon().title}>
                <img src={getEmailIcon().src} alt="Email status" />
              </div>
              <div className="resource-info">
                <span className="resource-label">Email</span>
                <span className="resource-value">
                  {userSettings?.email?.address || 'Не привязан'}
                </span>
              </div>
            </div>
            <div className="resource-item">
              <div className="resource-icon" title="Telegram">
                <img src="/src/assets/images/telegram-icon.svg" alt="Telegram" />
              </div>
              <div className="resource-info">
                <span className="resource-label">Telegram</span>
                <span className="resource-value">В разработке</span>
              </div>
            </div>
            <div className="resource-item">
              <div className="resource-icon" title="Discord">
                <img src="/src/assets/images/discord-icon.svg" alt="Discord" />
              </div>
              <div className="resource-info">
                <span className="resource-label">Discord</span>
                <span className="resource-value">В разработке</span>
              </div>
            </div>
          </div>
        </div>

        {activities.length > 0 && (
          <div className="profile-section">
            <h2>История активности</h2>
            <div className="activity-list">
              {activities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    <i className={`fas fa-${activity.type === 'login' ? 'sign-in-alt' : 
                                         activity.type === 'registration' ? 'user-plus' : 
                                         'sign-out-alt'}`}></i>
                  </div>
                  <div className="activity-info">
                    <div className="activity-type">{getActivityType(activity.type)}</div>
                    {activity.ip && <div className="activity-details">IP: {activity.ip}</div>}
                  </div>
                  <div className="activity-time">{formatDate(activity.date)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Профиль игрока</h1>
      </div>
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {renderContent()}

      <EmailVerificationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        onSuccess={handleEmailSuccess}
        currentEmail={userSettings?.email?.address}
        isVerified={userSettings?.email?.verified}
      />
    </div>
  );
};

export default Profile; 