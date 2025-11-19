import React from 'react';
import './SubmitStatus.css';

const SubmitStatus = ({ status, message, description }) => {
  const getStatusMessage = () => {
    if (message) return message;
    
    switch (status) {
      case 'loading':
        return 'Отправка заявки...';
      case 'success':
        return 'Заявка отправлена!';
      case 'error':
        return 'Ошибка отправки';
      default:
        return '';
    }
  };

  const getStatusDescription = () => {
    if (description) return description;
    
    switch (status) {
      case 'loading':
        return 'Пожалуйста, подождите';
      case 'success':
        return 'Ваша заявка успешно отправлена';
      case 'error':
        return 'Попробуйте еще раз или обратитесь в поддержку';
      default:
        return '';
    }
  };

  return (
    <div className="loading-screen">
      <div className="loading">
        <div className={`status-indicator ${status}`}>
          {status === 'loading' && (
            <div className="big-gray-spinner"></div>
          )}
          {status === 'success' && (
            <div className="success-checkmark">✓</div>
          )}
          {status === 'error' && (
            <div className="error-cross">✕</div>
          )}
          
          <div className="status-content">
            <div className="status-message">
              {getStatusMessage()}
            </div>
            <div className="status-description">
              {getStatusDescription()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitStatus;