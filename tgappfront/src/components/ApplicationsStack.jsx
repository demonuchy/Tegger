import React, { useState, memo, useEffect, useRef, useCallback, forwardRef } from 'react';
import { CSSTransition } from 'react-transition-group';
import LoadingSpinner from './LoaderSpiner';
import Error from './ErrorScreen';
import useApi from '../hooks/useAPI';

const Applications = () => {
    const { getActiveApplications, updateApplicationStatus } = useApi();
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRollup, setIsRollup] = useState(false);
    const [expandCardId, setExpandCardId] = useState(null);

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleCardExpand = useCallback((cardId) => {
        setExpandCardId(prev => {
            if (prev === cardId) return null;
            return cardId;
        });
    }, [setExpandCardId]);

    const rollupOnClicKHandler = useCallback(() => {
        if (isRollup) {
            setIsRollup(false);
            setExpandCardId(null);
            return;
        }
        setIsRollup(true);
    }, [isRollup, setIsRollup, setExpandCardId]);

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
            setApplications(prev => prev.filter(app => app.id !== applicationId));
            
            updateApplicationStatus(applicationId, status).catch(error => {
                console.error('Error updating application status:', error);
                alert('Не удалось обновить статус заявки на сервере');
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
    if (error) {
        return (
            <div className="applications-wrapper">
                <Error />
            </div>
        );
    }

    return (
        <div className="applications-wrapper">
            {isLoading ? (
                <LoadingSpinner fullScreen={false}/>
            ) : (
                <>
                    <div className="applications-top">
                        <div className="applications-count">
                            На рассмотрении: {applications.length} заявок
                        </div>
                        <p className="applications-tip">
                            Свайпните влево для отклонения или вправо для принятия
                        </p>
                    </div>
                    <div className='cards-stack-wrapper' style={{ height: isRollup ? `${applications.length * 40}vh` : '55vh' }}>
                        <div className={`rollup-button ${applications.length > 1 ? 'visible' : ''}`}>
                            <button onClick={rollupOnClicKHandler}>
                                {isRollup ? 'Свернуть' : 'Развернуть'}
                            </button>
                        </div>
                        <div className="cards-stack">
                            {applications.length === 0 ? (
                                <div className="empty-state">
                                    <img 
                                        className="empty-symbol" 
                                        src={`${process.env.PUBLIC_URL}/mail-box.png`}
                                        alt="Почтовый ящик"
                                    />
                                    <h3>Заявок пока нет</h3>
                                    <p>Новые заявки появятся здесь</p>
                                </div>
                            ) : (
                                applications.map((application, index) => (
                                   
                                    <ApplicationCard
                                        key={application.id}
                                        application={application}
                                        index={index}
                                        total={applications.length}
                                        onSwipe={handleUpdateStatus}
                                        formatDate={formatDate}
                                        getStatusText={getStatusText}
                                        isRollUp={isRollup}
                                        isExpand={expandCardId === application.id}
                                        onExpand={handleCardExpand}
                                    />
                        
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};


const ApplicationCard = memo(({ application, index, total, onSwipe, formatDate, getStatusText, isRollUp, isExpand, onExpand }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const dragRef = useRef(null);
    const startPos = useRef({ x: 0, y: 0 });
    const isHorizontalSwipeRef = useRef(false);
    const contentRef = useRef(null);

    const onClickHandler = () => {
        if (!isRollUp && index !== 0) {
            return;
        }
        onExpand(application.id);
    };

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
        if (isRollUp && index !== 0) {
            return;
        }
        if (!isDragging || isRemoving) {
            return;
        }
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
            
            setTimeout(() => {
                const status = swipeDirection === 'right' ? 'accept' : 'reject';
                onSwipe(application.id, status);
            }, 150);
        } else {
            setPosition({ x: 0, y: 0 });
            setSwipeDirection(null);
        }
    };

    const getCardStyle = (offsetY) => {
        if (isRemoving) {
            const translateX = swipeDirection === 'right' ? window.innerWidth : -window.innerWidth;
            return {
                transform: `translateX(${translateX}px) rotate(${position.x * 0.2}deg)`,
                opacity: Math.max(0, 1 - Math.abs(position.x) / 200),
                transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                zIndex: 1000,
            };
        }
        const baseScale = 1 - (index * 0.03);
        const baseTranslateY = index * offsetY;
        const scale = index === 0 ? 1 : baseScale;
        const translateY = index === 0 ? 0 : baseTranslateY;
        const swipeTransform = index === 0 ? `translateX(${position.x}px) rotate(${position.x * 0.1}deg)` : '';
        if (isRollUp) {
            return {
                transform: `${swipeTransform} translateY(${translateY}px) scale(1)`,
                transition: isDragging && index === 0 ? 'none' : 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                opacity: 1,
                zIndex: total - index,
                cursor: index === 0 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            };
        }
        return {
            transform: `${swipeTransform} translateY(${translateY}px) scale(${scale})`,
            transition: isDragging && index === 0 ? 'none' : 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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

    if (index >= 5) return null;

    return (
        <div 
            ref={dragRef}
            className={`stack-item ${swipeDirection ? 'swiping' : ''} ${isRemoving ? 'removing' : ''} ${isRollUp ? 'relative-transition' : ''} ${isExpand ? 'expanded' : ''}`}
            style={{
                ...getCardStyle(12),
                touchAction: index === 0 ? 'pan-y' : 'auto',
                position: isRollUp ? 'relative' : 'absolute',
            }}
            onClick={onClickHandler}
            onTouchStart={index === 0 ? handleTouchStart : undefined}
            onTouchMove={index === 0 ? handleTouchMove : undefined}
            onTouchEnd={index === 0 ? handleTouchEnd : undefined}
        >
            {index === 0 && (
                <div 
                    className="swipe-highlight"
                    style={{
                        background: getOverlayGradient(),
                    }}
                />
            )}
            
            {index === 0 && (
                <>
                    <div className={`swipe-hint left ${position.x < -50 ? 'visible' : ''}`}>
                        <div className="hint-icon">👎</div>
                        <div className="hint-text">Отклонить</div>
                    </div>
                    
                    <div className={`swipe-hint right ${position.x > 50 ? 'visible' : ''}`}>
                        <div className="hint-icon">👍</div>
                        <div className="hint-text">Принять</div>
                    </div>
                </>
            )}

            <div>
                <div className="card-top">
                    <div>
                        <h3 className="card-name">{application.full_name}</h3>
                        <div className="card-contacts">
                            <span className="contact-line">
                                <span className="contact-symbol">📱</span>
                                {application.phone_number}
                            </span>
                            {application.telegram_user_name && (
                                <span className="contact-line">
                                    <span className="contact-symbol">👤</span>
                                    @{application.telegram_user_name}
                                </span>
                            )}
                            
                            <CSSTransition
                                in={isExpand}
                                timeout={300}
                                classNames="expand-content"
                                unmountOnExit
                                nodeRef={contentRef}
                            >
                                <div ref={contentRef} className="expanded-content">
                                    <span className="contact-line">
                                        <span className="contact-symbol">📧</span>
                                        Дополнительный email: test@example.com
                                    </span>
                                    <span className="contact-line">
                                        <span className="contact-symbol">🏢</span>
                                        Отдел: Технический отдел
                                    </span>
                                </div>
                            </CSSTransition>
                        </div>
                    </div>
                </div>
                <div className="card-details">
                    <div className="detail-line">
                        <span className="detail-name">Дата заявки:</span>
                        <span className="detail-value">{formatDate(application.created_at)}</span>
                    </div>
                    <div className="detail-line">
                        <span className="detail-name">Статус:</span>
                        <span className="status-tag">
                            {getStatusText(application.status)}
                        </span>
                    </div>
                    {application.comment && (
                        <div className="detail-line">
                            <span className="detail-name">Комментарий:</span>
                            <span className="detail-value">{application.comment}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

ApplicationCard.displayName = 'ApplicationCard';

export default Applications;