// components/Home.js
import React, { useState, memo, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import Applications from './ApplicationsStack';
//import Applications from './ApplicationsStackV2';
import PersonalCabinet from './UserProfile';
import EventsList from './Mero';

const Home = () => {
  const { userData, telegramUser } = useUser();
  const [activeTab, setActiveTab] = useState('events');
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

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

  // Эффект для анимации header'а при смене вкладки
  useEffect(() => {
    // Показываем header при смене вкладки
    setIsHeaderVisible(true);
    
    // Через 1 секунду скрываем header
    const timer = setTimeout(() => {
      setIsHeaderVisible(false);
    }, 1500);

    // Очищаем таймер при размонтировании или при следующем вызове useEffect
    return () => clearTimeout(timer);
  }, [activeTab]); // Зависимость от activeTab - эффект сработает при каждой смене вкладки

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="app-wrapper">
      <div className="main-wrapper">
        <header 
          className={`section-header ${isHeaderVisible ? 'header-visible' : 'header-hidden'}`}
        >
          <h1 className="section-title">{tabTitles[activeTab]}</h1>
        </header>

        <main className="section-content">
          {tabs.find(tab => tab.id === activeTab)?.component}
        </main>

        <footer className="navigation-bar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
            </button>
          ))}
        </footer>
      </div>
    </div>
  );
};

export default memo(Home);