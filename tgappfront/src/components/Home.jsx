import React, { useState, memo, useEffect } from 'react';
import useApi from '../hooks/useAPI';
import { useTelegram } from '../hooks/useTelegramAPI';
import Applications from './ApplicationsStack';
import PersonalCabinet from './UserProfile';
import EventsList from './Mero';

// Компонент личного кабинета


// Компонент заявок с реальным функционалом и свайпом
const Home = () => {
  const { getMeRequest } = useApi();
  const { user: telegramUser } = useTelegram();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('events');
  const [minLoadingShown, setMinLoadingShown] = useState(false);

  useEffect(() => {
    if (telegramUser?.id) {
      fetchUserData();
    }
  }, [telegramUser]);

  // Минимальное время показа лоадера
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingShown(true);
    }, 800); // 800ms минимальное время показа лоадера
    
    return () => clearTimeout(timer);
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!telegramUser?.id) {
        throw new Error('Telegram user data not available');
      }

      const response = await getMeRequest(telegramUser.id.toString());
      console.log("User data", response.user);
      
      if (response.user) {
        setUserData(response.user);
      } else {
        // Если пользователь не найден, редирект на отправку заявки Application.jsx
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      
      // Если ошибка 404 или пользователь не найден, создаем базовый объект
      if (err.response?.status === 404 || err.message?.includes('404') || err.message?.includes('not found')) {
        setUserData({
          id: telegramUser.id,
          full_name: telegramUser.first_name + (telegramUser.last_name ? ` ${telegramUser.last_name}` : ''),
          username: telegramUser.username,
          is_admin: false,
          created_at: new Date().toISOString()
        });
      } else {
        setError('Ошибка загрузки данных пользователя');
      }
    } finally {
      // Ждем минимум 800ms перед скрытием лоадера
      setTimeout(() => {
        setIsLoading(false);
      }, minLoadingShown ? 0 : 300);
    }
  };

  // Определяем доступные вкладки
  const tabs = [
    { id: 'events', label: 'Мероприятия', icon: '📅', component: <EventsList /> },
    { id: 'personal', label: 'Профиль', icon: '👤', component: <PersonalCabinet userData={userData} telegramUser={telegramUser} /> },
  ];

  // Добавляем вкладку заявок если пользователь админ
  if (userData?.is_admin) {
    tabs.push({ id: 'applications', label: 'Заявки', icon: '📋', component: <Applications /> });
  }
  
  console.log("Current user data", userData);

  const tabTitles = {
    'events': 'Мероприятия',
    'personal': 'Личный кабинет', 
    'applications': 'Заявки волонтеров'
  };


  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading">
          <div className="orange-spinner"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="loading-screen">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h3>Ошибка</h3>
          <p>{error}</p>
          <button onClick={fetchUserData} className="retry-button">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="main-screen">
        {/* Фиксированный заголовок вкладки */}
        <header className="tab-header">
          <h1 className="tab-title">{tabTitles[activeTab]}</h1>
        </header>

        {/* Контент активной вкладки */}
        <main className="tab-content">
          {tabs.find(tab => tab.id === activeTab)?.component}
        </main>

        {/* Нижняя панель навигации */}
        <footer className="bottom-navigation">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </footer>
      </div>
    </div>
  );
};

export default memo(Home);