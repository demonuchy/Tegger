// components/Home.js
import React, { useState, memo, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import Applications from './ApplicationsStack';
//import Applications from './ApplicationsStackV2';
import PersonalCabinet from './UserProfile';
import EventsList from './Mero';

const Home = () => {
  const { userData, telegramUser } = useUser();
  const [activeTab, setActiveTab] = useState('events');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const startPosition = useRef({ x: 0, y: 0 });
  const swipeDirectionRef = useRef(null); // 'left' или 'right'
  const isHorizontalSwipeRef = useRef(false);
  const lastDiffXRef = useRef(0);

  const tabs = [
    { id: 'events', label: 'Мероприятия', icon: '📅', component: <EventsList /> },
    { id: 'personal', label: 'Профиль', icon: '👤', component: <PersonalCabinet /> },
  ];

  // Добавляем вкладку заявок только для администраторов
  if (userData?.is_admin) {
    tabs.push({ id: 'applications', label: 'Заявки', icon: '📋', component: <Applications /> });
  }
  
  console.log("Current user data", userData);

  const tabTitles = {
    'events': 'Мероприятия',
    'personal': 'Личный кабинет', 
    'applications': 'Заявки волонтеров'
  };

  useEffect(() => {
    setIsHeaderVisible(true);
    const timer = setTimeout(() => {
      setIsHeaderVisible(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [activeTab]); 

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };


  const handleTouchStart = (e)=>{
    const touch = e.touches[0];
    startPosition.current = {x : touch.clientX, y :  touch.clientY}
    isHorizontalSwipeRef.current = false
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
      lastDiffXRef.current = diffX; // сохраняем текущее смещение
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

  return (
    <div className="app-wrapper">
      <div className="main-wrapper">
        <header 
          className={`section-header ${isHeaderVisible ? 'header-visible' : 'header-hidden'}`}>
          <h1 className="section-title">{tabTitles[activeTab]}</h1>
        </header>

        <main className="section-content">
          {tabs.find(tab => tab.id === activeTab)?.component}
        </main>

        <footer 
          className="navigation-bar"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {tabs.map(tab => (
            <span
              key={tab.id}className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}>
              <span className="nav-icon">{tab.icon}</span>
            </span>
          ))}
        </footer>
      </div>
    </div>
  );
};

export default memo(Home);