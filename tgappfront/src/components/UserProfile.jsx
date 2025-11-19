// components/UserProfile.js
import React from 'react';
import { useUser } from '../contexts/UserContext';

const PersonalCabinet = () => {
  const { userData, telegramUser } = useUser();

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        <div className="profile-image">
          <div className="image-placeholder">
            <img src={telegramUser.photo_url} alt="Avatar" />
          </div>
        </div>
        
        <div>
          <h3 className="profile-name">{userData?.full_name || `${telegramUser?.first_name} ${telegramUser?.last_name || ''}`}</h3>
          
          <div className="info-block">
            <h4>Telegram данные</h4>
            <div className="info-row">
              <span className="info-label">ID:</span>
              <span className="info-content">{telegramUser?.id || 'Не доступно'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Username:</span>
              <span className="info-content">@{telegramUser?.username || 'Не указан'}</span>
            </div>
          </div>

          <div className="info-block">
            <h4>Данные приложения</h4>
            <div className="info-row">
              <span className="info-label">Телефон:</span>
              <span className="info-content">{userData?.phone_number || 'Не указан'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Статус:</span>
              <span className="info-content">{userData?.status || 'Не указан'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Роль:</span>
              <span className={`role-indicator ${userData?.is_admin ? 'admin' : 'user'}`}>
                {userData?.is_admin ? 'Администратор' : 'Пользователь'}
              </span>
            </div>
            {userData?.created_at && (
              <div className="info-row">
                <span className="info-label">Дата регистрации:</span>
                <span className="info-content">{formatDate(userData.created_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalCabinet;