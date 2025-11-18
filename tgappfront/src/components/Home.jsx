import React, { useState, memo, useEffect, useRef } from 'react';
import useApi from '../hooks/useAPI';
import { useTelegram } from '../hooks/useTelegramAPI';

// Компонент личного кабинета
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
const EventsList = () => {
  const events = [
    { id: 1, title: 'Волонтерский субботник', date: '2024-01-15', location: 'Парк Победы' },
    { id: 2, title: 'Экологический марафон', date: '2024-01-20', location: 'Набережная Дона' },
    { id: 3, title: 'Очистка береговой линии', date: '2024-01-25', location: 'Левый берег Дона' },
  ];

  return (
    <div className="events-list">
      <div className="events">
        {events.map(event => (
          <div key={event.id} className="event-card">
            <h3>{event.title}</h3>
            <p>📅 Дата: {event.date}</p>
            <p>📍 Место: {event.location}</p>
            <button className="event-button">Участвовать</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Компонент заявок с реальным функционалом и свайпом
const Applications = () => {
    const { getActiveApplications, updateApplicationStatus } = useApi();
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      fetchApplications();
    }, []);
  
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getActiveApplications("active");
        
        if (response.applications) {
          setApplications(response.applications);
        } else if (response.status === 404 || !response.applications || response.applications.length === 0) {
          setApplications([]);
        } else {
          throw new Error('Некорректный формат ответа');
        }
      } catch (err) {
        console.error('Error fetching applications:', err);
        if (err.response?.status === 404 || err.message?.includes('404')) {
          setApplications([]);
          setError(null);
        } else {
          setError('Не удалось загрузить заявки');
        }
      } finally {
        setIsLoading(false);
      }
    };
  
    const handleUpdateStatus = async (applicationId, status) => {
      try {
        await updateApplicationStatus(applicationId, status);
        setApplications(prev => prev.filter(app => app.id !== applicationId));
      } catch (error) {
        console.error('Error updating application status:', error);
        alert('Не удалось обновить статус заявки');
        await fetchApplications();
      }
    };
  
    const getStatusText = (status) => {
      switch(status) {
        case 'accepted': return 'Принята';
        case 'rejected': return 'Отклонена';
        case 'pending': return 'На рассмотрении';
        default: return status;
      }
    };
  
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
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
  
    if (error) {
      return (
        <div className="applications-container">
          <div className="applications-error">
            <div className="error-icon">⚠️</div>
            <h3>Ошибка загрузки</h3>
            <p>{error}</p>
            <button onClick={fetchApplications} className="retry-button">
              Попробовать снова
            </button>
          </div>
        </div>
      );
    }
  
    return (
      <div className="applications-container">
        <div className="applications-header">
          <div className="applications-count">
            На рассмотрении: {applications.length} заявок
          </div>
          <p className="applications-hint">
            Свайпните влево для отклонения или вправо для принятия
          </p>
        </div>
  
        <div className="applications-stack">
          {applications.length === 0 ? (
            <div className="empty-applications">
              <div className="empty-icon">📭</div>
              <h3>Заявок пока нет</h3>
              <p>Новые заявки появятся здесь</p>
            </div>
          ) : (
            <div className="stack-container">
              {applications.map((application, index) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  index={index}
                  total={applications.length}
                  onSwipe={handleUpdateStatus}
                  formatDate={formatDate}
                  getStatusText={getStatusText}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Компонент карточки заявки с улучшенным дизайном
 // Компонент карточки заявки с улучшенным дизайном
const ApplicationCard = memo(({ application, index, total, onSwipe, formatDate, getStatusText }) => {
    const [swipeOffset, setSwipeOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const cardRef = useRef(null);
    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const isHorizontalSwipeRef = useRef(false);
  
    const handleTouchStart = (e) => {
      if (isRemoving) return;
      
      const touch = e.touches[0];
      setIsSwiping(true);
      isHorizontalSwipeRef.current = false;
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      setSwipeOffset(0);
      setSwipeDirection(null);
    };
  
    const handleTouchMove = (e) => {
      if (!isSwiping || isRemoving) return;
      
      const touch = e.touches[0];
      const currentX = touch.clientX;
      const currentY = touch.clientY;
      const startX = startXRef.current;
      const startY = startYRef.current;
      
      const diffX = currentX - startX;
      const diffY = currentY - startY;
  
      if (!isHorizontalSwipeRef.current) {
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 5) {
          isHorizontalSwipeRef.current = true;
        } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 5) {
          setIsSwiping(false);
          setSwipeOffset(0);
          setSwipeDirection(null);
          return;
        }
      }
  
      if (isHorizontalSwipeRef.current) {
        const maxOffset = 200;
        const boundedDiff = Math.max(Math.min(diffX, maxOffset), -maxOffset);
        
        setSwipeOffset(boundedDiff);
  
        if (Math.abs(boundedDiff) > 10) {
          setSwipeDirection(boundedDiff > 0 ? 'right' : 'left');
        }
      }
    };
  
    const handleTouchEnd = () => {
      if (!isSwiping || isRemoving || !isHorizontalSwipeRef.current) return;
      
      setIsSwiping(false);
      isHorizontalSwipeRef.current = false;
      
      if (Math.abs(swipeOffset) > 80) {
        setIsRemoving(true);
        setTimeout(() => {
          const status = swipeDirection === 'right' ? 'accept' : 'reject';
          onSwipe(application.id, status);
        }, 300);
      } else {
        setSwipeOffset(0);
        setSwipeDirection(null);
      }
    };
  
    const getCardStyle = () => {
      const translateX = isRemoving 
        ? swipeDirection === 'right' 
          ? window.innerWidth 
          : -window.innerWidth
        : swipeOffset;
  
      const opacity = isRemoving 
        ? Math.max(0, 1 - Math.abs(swipeOffset) / 200) 
        : 1;
  
      const stackOffset = index * 4;
      const scale = 1 - (index * 0.03);
      const zIndex = total - index;
  
      return {
        transform: `translateX(${translateX}px) rotate(${swipeOffset * 0.05}deg) scale(${scale}) translateY(${stackOffset}px)`,
        transition: isSwiping ? 'transform 0.1s ease' : 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        opacity: opacity,
        willChange: 'transform',
        zIndex: zIndex,
      };
    };
  
    const getOverlayGradient = () => {
      if (!swipeDirection) return '';
      
      const intensity = Math.min(Math.abs(swipeOffset) / 100, 0.6);
      
      if (swipeDirection === 'right') {
        return `linear-gradient(135deg, rgba(34, 197, 94, ${intensity}) 0%, rgba(34, 197, 94, ${intensity * 0.5}) 100%)`;
      } else {
        return `linear-gradient(225deg, rgba(239, 68, 68, ${intensity}) 0%, rgba(239, 68, 68, ${intensity * 0.5}) 100%)`;
      }
    };
  
    // Показываем до 5 карточек в стопке для лучшего визуального эффекта
    if (index >= 5) return null;
  
    return (
      <div 
        ref={cardRef}
        className={`application-card-stack ${swipeDirection ? `swipe-${swipeDirection}` : ''} ${isRemoving ? 'removing' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          ...getCardStyle(),
          touchAction: 'pan-y',
        }}
      >
        {/* Градиентный оверлей поверх основного фона */}
        <div 
          className="swipe-overlay"
          style={{
            background: getOverlayGradient(),
          }}
        />
        
        <div className="card-content">
          <div className="card-header">
            <div className="user-info">
              <h3 className="user-name">{application.full_name}</h3>
              <div className="user-contacts">
                <span className="contact-item">
                  <span className="contact-icon">📱</span>
                  {application.phone_number}
                </span>
                {application.telegram_user_name && (
                  <span className="contact-item">
                    <span className="contact-icon">👤</span>
                    @{application.telegram_user_name}
                  </span>
                )}
              </div>
            </div>
          </div>
  
          <div className="application-details">
            <div className="detail-row">
              <span className="detail-label">Дата заявки:</span>
              <span className="detail-value">{formatDate(application.created_at)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Статус:</span>
              <span className="status-badge">
                {getStatusText(application.status)}
              </span>
            </div>
            {application.comment && (
              <div className="detail-row">
                <span className="detail-label">Комментарий:</span>
                <span className="detail-value comment">{application.comment}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  });
  
  ApplicationCard.displayName = 'ApplicationCard';

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