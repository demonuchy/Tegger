import React, { useState, memo, useEffect, useRef } from 'react';
import useApi from '../hooks/useAPI';
import { useTelegram } from '../hooks/useTelegramAPI';
import './ApplicationStack.css';

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
        // Оптимистичное обновление - сразу удаляем карточку из стека
        setApplications(prev => prev.filter(app => app.id !== applicationId));
        
        // Отправляем запрос на сервер в фоне (не ждем ответа)
        updateApplicationStatus(applicationId, status).catch(error => {
          console.error('Error updating application status:', error);
          // В случае ошибки можно показать уведомление или попробовать снова
          alert('Не удалось обновить статус заявки на сервере');
          // Можно добавить логику для повторной отправки или восстановления состояния
        });
      } catch (error) {
        console.error('Error in handleUpdateStatus:', error);
      }
    };
  
    const getStatusText = (status) => {
      switch(status) {
        case 'accept': return 'Принята';
        case 'reject': return 'Отклонена';
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

// Компонент карточки заявки
const ApplicationCard = memo(({ application, index, total, onSwipe, formatDate, getStatusText }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const dragRef = useRef(null);
    const startPos = useRef({ x: 0, y: 0 });
    const isHorizontalSwipeRef = useRef(false);

    const handleTouchStart = (e) => {
        if (isRemoving || index !== 0) return;
        
        const touch = e.touches[0];
        setIsDragging(true);
        isHorizontalSwipeRef.current = false;
        startPos.current = {
            x: touch.clientX,
            y: touch.clientY
        };
        setPosition({ x: 0, y: 0 });
        setSwipeDirection(null);
        e.preventDefault();
    };

    const handleTouchMove = (e) => {
        if (!isDragging || isRemoving || index !== 0) return;
        
        const touch = e.touches[0];
        const currentX = touch.clientX;
        const currentY = touch.clientY;
        const startX = startPos.current.x;
        const startY = startPos.current.y;
        
        const diffX = currentX - startX;
        const diffY = currentY - startY;

        if (!isHorizontalSwipeRef.current) {
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 5) {
                isHorizontalSwipeRef.current = true;
            } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 5) {
                setIsDragging(false);
                setPosition({ x: 0, y: 0 });
                setSwipeDirection(null);
                return;
            }
        }

        if (isHorizontalSwipeRef.current) {
            const maxOffset = 200;
            const boundedDiff = Math.max(Math.min(diffX, maxOffset), -maxOffset);
            
            setPosition({ x: boundedDiff, y: 0 });

            if (Math.abs(boundedDiff) > 10) {
                setSwipeDirection(boundedDiff > 0 ? 'right' : 'left');
            }
        }
        e.preventDefault();
    };

    const handleTouchEnd = () => {
        if (!isDragging || isRemoving || !isHorizontalSwipeRef.current || index !== 0) return;
        
        setIsDragging(false);
        isHorizontalSwipeRef.current = false;
        
        const swipeThreshold = 80;
        
        if (Math.abs(position.x) > swipeThreshold) {
            setIsRemoving(true);
            
            // Немедленно вызываем колбэк для удаления карточки
            setTimeout(() => {
                const status = swipeDirection === 'right' ? 'accept' : 'reject';
                onSwipe(application.id, status);
            }, 150); // Уменьшаем задержку для более быстрого отклика
        } else {
            // Возвращаем карточку на место
            setPosition({ x: 0, y: 0 });
            setSwipeDirection(null);
        }
    };

    const getCardStyle = () => {
        if (isRemoving) {
            const translateX = swipeDirection === 'right' ? window.innerWidth : -window.innerWidth;
            return {
                transform: `translateX(${translateX}px) rotate(${position.x * 0.2}deg)`,
                opacity: Math.max(0, 1 - Math.abs(position.x) / 200),
                transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Ускоряем анимацию
                zIndex: 1000,
            };
        }

        // Стандартные стили для стопки
        const baseScale = 1 - (index * 0.03);
        const baseTranslateY = index * 12;
        const scale = index === 0 ? 1 : baseScale;
        const translateY = index === 0 ? 0 : baseTranslateY;

        // Для активной (верхней) карточки добавляем свайп
        const swipeTransform = index === 0 ? `translateX(${position.x}px) rotate(${position.x * 0.1}deg)` : '';

        return {
            transform: `${swipeTransform} translateY(${translateY}px) scale(${scale})`,
            transition: isDragging && index === 0 ? 'none' : 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Ускоряем переходы
            opacity: 1,
            zIndex: total - index,
            cursor: index === 0 ? (isDragging ? 'grabbing' : 'grab') : 'default',
        };
    };

    const getOverlayGradient = () => {
        if (!swipeDirection || index !== 0) return '';
        
        const intensity = Math.min(Math.abs(position.x) / 100, 0.6);
        
        if (swipeDirection === 'right') {
            return `linear-gradient(135deg, rgba(34, 197, 94, ${intensity}) 0%, rgba(34, 197, 94, ${intensity * 0.5}) 100%)`;
        } else {
            return `linear-gradient(225deg, rgba(239, 68, 68, ${intensity}) 0%, rgba(239, 68, 68, ${intensity * 0.5}) 100%)`;
        }
    };

    // Показываем только верхние 5 карточек
    if (index >= 5) return null;

    return (
        <div 
            ref={dragRef}
            className={`application-card-stack ${swipeDirection ? `swipe-${swipeDirection}` : ''} ${isRemoving ? 'removing' : ''}`}
            style={{
                ...getCardStyle(),
                touchAction: index === 0 ? 'pan-y' : 'auto',
            }}
            onTouchStart={index === 0 ? handleTouchStart : undefined}
            onTouchMove={index === 0 ? handleTouchMove : undefined}
            onTouchEnd={index === 0 ? handleTouchEnd : undefined}
        >
            {/* Градиентный оверлей при свайпе (только для верхней карточки) */}
            {index === 0 && (
                <div 
                    className="swipe-overlay"
                    style={{
                        background: getOverlayGradient(),
                    }}
                />
            )}
            
            {/* Индикаторы свайпа (только для верхней карточки) */}
            {index === 0 && (
                <>
                    <div className={`swipe-indicator left ${position.x < -50 ? 'visible' : ''}`}>
                        <div className="indicator-icon">👎</div>
                        <div className="indicator-text">Отклонить</div>
                    </div>
                    
                    <div className={`swipe-indicator right ${position.x > 50 ? 'visible' : ''}`}>
                        <div className="indicator-icon">👍</div>
                        <div className="indicator-text">Принять</div>
                    </div>
                </>
            )}

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

export default Applications;