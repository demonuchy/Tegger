// components/UserProfile.js
import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';

const PersonalCabinet = () => {
  const { userData, telegramUser } = useUser();
  const [position, setPosition] = useState(null)
  const startPosition = useRef({ x: 0, y: 0 });
  const swipeDirectionRef = useRef(null); // 'left' или 'right'
  const isHorizontalSwipeRef = useRef(false);
  const lastDiffXRef = useRef(0);


  const handleTouchStart = (e)=>{
    const touch = e.touches[0];
    startPosition.current = {x : touch.clientX, y :  touch.clientY}
    isHorizontalSwipeRef.current = false
    setPosition({x : 0, y : 0})
  }
  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    const startX = startPosition.current.x;
    const startY = startPosition.current.y;
  
    const diffX = currentX - startX;
    const diffY = currentY - startY;
  
    if (!isHorizontalSwipeRef.current) {
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
        isHorizontalSwipeRef.current = true;
        swipeDirectionRef.current = diffX > 0 ? 'right' : 'left';
        e.preventDefault();
      } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
        return; 
      } else {
        return; 
      }
    }
  
    if (isHorizontalSwipeRef.current) {
      e.preventDefault();
      const maxOffset = 100
      const boundedDiff = Math.max(Math.min(diffX, maxOffset), -maxOffset);
      lastDiffXRef.current = diffX
      setPosition({x : boundedDiff, y : 0}) 
    }
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 80;
    if (isHorizontalSwipeRef.current && Math.abs(lastDiffXRef.current) > swipeThreshold) {
      const direction = lastDiffXRef.current > 0 ? 'right' : 'left';
      console.log('Свайп', direction);
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      let newIndex;
      if (direction === 'right' && currentIndex < tabs.length - 1) {
        newIndex = currentIndex + 1;
      } else if (direction === 'left' && currentIndex > 0) {
        newIndex = currentIndex - 1;
      }
      if (newIndex !== undefined) {
        setActiveTab(tabs[newIndex].id);
      }
    }
    startPosition.current = { x: 0, y: 0 };
    isHorizontalSwipeRef.current = false;
    swipeDirectionRef.current = null;
    lastDiffXRef.current = 0;
  };


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
          
          <div className='info-block-wrapper'>
            <h4>Telegram</h4>
            <div className="info-block">
              <div className="info-row">
                <span className="info-label">ID:</span>
                <span className="info-content">{telegramUser?.id || 'Не доступно'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Username:</span>
                <span className="info-content">@{telegramUser?.username || 'Не указан'}</span>
              </div>
            </div>
          </div>


          <div className='info-block-wrapper'>
            <h4>Основные</h4>
            <div className="info-block">
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
    </div>
  );
};

export default PersonalCabinet;