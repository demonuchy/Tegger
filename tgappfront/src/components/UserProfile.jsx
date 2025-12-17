// components/UserProfile.js
import React, { useState, useEffect, useCallback, useRef } from 'react';

import { useUser } from '../contexts/UserContext';
import InfoBlockCard from './InfoBlock';



// data/userInfoData.js
export const getUserInfoData = (userData, telegramUser, formatDate) => ({
  telegram: {
    title: "Telegram",
    data: [
      {
        label: "ID",
        value: telegramUser?.id || 'Не доступно'
      },
      {
        label: "Username",
        value: `@${telegramUser?.username || 'Не указан'}`
      }
    ]
  },
  main: {
    title: "Основные",
    data: [
      {
        label: "Телефон",
        value: userData?.phone_number || 'Не указан'
      },
      {
        label: "Статус",
        value: userData?.status || 'Не указан'
      },
      {
        label: "Роль",
        value: userData?.is_admin ? 'Администратор' : 'Пользователь',
        className: `role-indicator ${userData?.is_admin ? 'admin' : 'user'}`
      },
      ...(userData?.created_at ? [{
        label: "Дата регистрации",
        value: formatDate(userData.created_at)
      }] : [])
    ]
  },
  personal: {
    title: "Личные",
    data: [
      {
        label: "ФИО",
        value: userData?.full_name || 'Не доступно'
      },
      {
        label: "Username",
        value: 'Не указан'
      }
    ]
  }
});


const PersonalCabinet = () => {
  const { userData, telegramUser } = useUser();
  const [infoBlockEditId, setInfoBlockEditId] = useState(null)

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const infoData = getUserInfoData(userData, telegramUser, formatDate);

  const handleScanClick = useCallback(() => {
    alert('Функция пока что не доступна');
  }, []);


  return (
    <div className={`profile-wrapper ${infoBlockEditId ? 'edit-mode' : ''}`}>
      
      <div className="profile-card">
        <div className="profile-image">
          <div className="image-placeholder">
            <img src={telegramUser.photo_url} alt="Avatar" />
          </div>
        </div>
        
        <div>
          <h3 className="profile-name">
            {userData?.full_name || `${telegramUser?.first_name} ${telegramUser?.last_name || ''}`}
          </h3>
          
          <div className="scan-section">
            <button onClick={handleScanClick} className="scan-btn">
              Сканировать документ
            </button>
          </div>
          
          {/* Рендерим карточки через компонент */}
          {Object.entries(infoData).map(([index,{ title, data}] ) => (
            <InfoBlockCard
              index={index}
              infoBlockEditId={infoBlockEditId}
              setInfoBlockEditId={setInfoBlockEditId}
              title={title}
              data={data}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PersonalCabinet;