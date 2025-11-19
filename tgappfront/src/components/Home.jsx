// components/Home.js
import React, { useState, memo } from 'react';
import { useUser } from '../contexts/UserContext';
import Applications from './ApplicationsStack';
import PersonalCabinet from './UserProfile';
import EventsList from './Mero';

const Home = () => {
  const { userData, telegramUser } = useUser();
  const [activeTab, setActiveTab] = useState('events');

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

  return (
    <div className="app-wrapper">
      <div className="main-wrapper">
        <header className="section-header">
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
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-text">{tab.label}</span>
            </button>
          ))}
        </footer>
      </div>
    </div>
  );
};

export default memo(Home);