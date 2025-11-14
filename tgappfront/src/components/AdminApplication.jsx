import React, { useState, memo } from 'react';

// Memo компонент карточки заявки
const ApplicationCard = memo(({ application, isActive, onClick }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className={`application-card ${isActive ? 'active' : ''}`}
      onClick={() => onClick(application)}
    >
      <div className="card-content">
        <div className="card-header">
          <div className="user-info">
            <h3 className="user-name">{application.fullName}</h3>
            <div className="user-contacts">
              <span className="contact-item">
                <span className="contact-icon">📱</span>
                {application.phoneNumber}
              </span>
              <span className="contact-item">
                <span className="contact-icon">👤</span>
                {application.telegramUserName}
              </span>
            </div>
          </div>
        </div>

        <div className="application-meta">
          <div className="meta-item">
            <span className="meta-label">Создана:</span>
            <span className="meta-value">{formatDate(application.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

ApplicationCard.displayName = 'ApplicationCard';

// Компонент действий для активной карточки
const CardActions = memo(({ application, onAccept, onReject, onClose }) => {
  return (
    <div className="card-actions-modal">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-content">
        <div className="actions-header">
          <h3>Действия с заявкой</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="user-details">
          <p><strong>ФИО:</strong> {application.fullName}</p>
          <p><strong>Телефон:</strong> {application.phoneNumber}</p>
          <p><strong>Telegram:</strong> {application.telegramUserName}</p>
          <p><strong>Дата создания:</strong> {new Date(application.createdAt).toLocaleString('ru-RU')}</p>
        </div>
        <div className="action-buttons">
          <button 
            className="action-btn accept"
            onClick={() => onAccept(application)}
          >
            <span className="btn-icon">✅</span>
            Принять заявку
          </button>
          <button 
            className="action-btn reject"
            onClick={() => onReject(application)}
          >
            <span className="btn-icon">❌</span>
            Отклонить заявку
          </button>
        </div>
      </div>
    </div>
  );
});

CardActions.displayName = 'CardActions';

// Основной компонент
const AdminApplications = () => {
  const [applications, setApplications] = useState([
    {
      fullName: "Иван Иванов",
      phoneNumber: "+7 (999) 123-45-67",
      telegramUserName: "ivan_ivanov",
      status: "active",
      createdAt: "2024-01-15T10:30:00Z"
    },
    {
      fullName: "Мария Петрова",
      phoneNumber: "+7 (999) 765-43-21",
      telegramUserName: "maria_petrova",
      status: "pending",
      createdAt: "2024-01-15T11:15:00Z"
    },
    {
      fullName: "Алексей Сидоров",
      phoneNumber: "+7 (999) 555-44-33",
      telegramUserName: "alexey_sidorov",
      status: "completed",
      createdAt: "2024-01-14T09:20:00Z"
    }
  ]);

  const [activeApplication, setActiveApplication] = useState(null);

  // Обработчики действий
  const handleCardClick = (application) => {
    setActiveApplication(application);
  };

  const handleCloseActions = () => {
    setActiveApplication(null);
  };

  const handleAccept = (application) => {
    console.log('Принята заявка:', application);
    setApplications(prev => prev.filter(app => app.fullName !== application.fullName));
    setActiveApplication(null);
  };

  const handleReject = (application) => {
    console.log('Отклонена заявка:', application);
    setApplications(prev => prev.filter(app => app.fullName !== application.fullName));
    setActiveApplication(null);
  };

  return (
    <div className="applications-container">
      {/* Заголовок */}
      <div className="applications-header">
        <h1 className="applications-title">
          <span className="title-accent">Заявки</span> пользователей
        </h1>
      </div>

      {/* Список заявок */}
      <div className={`applications-list ${activeApplication ? 'blur-background' : ''}`}>
        {applications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Заявок пока нет</h3>
            <p>Новые заявки появятся здесь</p>
          </div>
        ) : (
          applications.map((application, index) => (
            <ApplicationCard
              key={index}
              application={application}
              isActive={activeApplication?.fullName === application.fullName}
              onClick={handleCardClick}
            />
          ))
        )}
      </div>

      {/* Модальное окно с кнопками действий */}
      {activeApplication && (
        <CardActions
          application={activeApplication}
          onAccept={handleAccept}
          onReject={handleReject}
          onClose={handleCloseActions}
        />
      )}
    </div>
  );
};

export default AdminApplications;