import React from 'react';
import './UserProfile.css'


const PersonalCabinet = ({ userData, telegramUser }) => {
    const formatDate = (dateString) => {
      if (!dateString) return 'Не указана';
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };
  
    return (
      <div className="personal-cabinet">
        <div className="user-info-card">
          <div className="user-avatar">
            <div className="avatar-placeholder">
              {userData.full_name?.charAt(0) || telegramUser?.first_name?.charAt(0) || 'U'}
            </div>
          </div>
          
          <div className="user-info-content">
            <h3 className="user-name">{userData.full_name || `${telegramUser?.first_name} ${telegramUser?.last_name || ''}`}</h3>
            
            <div className="info-section">
              <h4>Telegram данные</h4>
              <div className="info-item">
                <span className="info-label">ID:</span>
                <span className="info-value">{telegramUser?.id || 'Не доступно'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Username:</span>
                <span className="info-value">@{telegramUser?.username || 'Не указан'}</span>
              </div>
            </div>
  
            <div className="info-section">
              <h4>Данные приложения</h4>
              <div className="info-item">
                <span className="info-label">Телефон:</span>
                <span className="info-value">{userData.phone_number || 'Не указан'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Статус:</span>
                <span className="info-value">{userData.status || 'Не указан'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Роль:</span>
                <span className={`role-badge ${userData.is_admin ? 'admin' : 'user'}`}>
                  {userData.is_admin ? 'Администратор' : 'Пользователь'}
                </span>
              </div>
              {userData.created_at && (
                <div className="info-item">
                  <span className="info-label">Дата регистрации:</span>
                  <span className="info-value">{formatDate(userData.created_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Компонент мероприятий
export default PersonalCabinet