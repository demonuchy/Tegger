// components/UserProfile.js
import React, { useState, useEffect, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useUser } from '../contexts/UserContext';
import { useDocumentScanner } from '../hooks/useDocumentScanner';

const PersonalCabinet = () => {
  const { userData, telegramUser } = useUser();
  const { 
    isCameraActive, 
    cameraRef, 
    startCamera, 
    stopCamera, 
    startDocumentDetection,
    stopDocumentDetection,
    modelLoaded 
  } = useDocumentScanner();
  
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectionStatus, setDetectionStatus] = useState('Ожидание документа...');

  // Обработчик обнаружения документа
  const handleDocumentDetected = useCallback((image) => {
    console.log('Документ обнаружен!', image);
    setCapturedImage(image);
    setDetectionStatus('Документ распознан!');
  }, []);

  // Запускаем обнаружение когда камера активна и модель загружена
  useEffect(() => {
    if (isCameraActive && modelLoaded && !capturedImage) {
      console.log('Запуск обнаружения документа');
      startDocumentDetection();
      setDetectionStatus('Наведите документ на рамку...');
    } else if (capturedImage) {
      stopDocumentDetection();
    }

    return () => {
      stopDocumentDetection();
    };
  }, [isCameraActive, modelLoaded, capturedImage, startDocumentDetection, stopDocumentDetection]);

  const handleScanClick = () => {
    setCapturedImage(null);
    setDetectionStatus('Ожидание документа...');
    // Передаем callback для обработки обнаруженного документа
    startCamera(handleDocumentDetected);
  };

  const handleCloseCamera = () => {
    stopCamera();
    stopDocumentDetection();
    setCapturedImage(null);
    setDetectionStatus('Ожидание документа...');
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setDetectionStatus('Наведите документ на рамку...');
    // Перезапускаем обнаружение после пересъемки
    setTimeout(() => {
      if (isCameraActive && modelLoaded) {
        startDocumentDetection();
      }
    }, 100);
  };

  const handleConfirm = () => {
    console.log('Изображение подтверждено:', capturedImage);
    handleCloseCamera();
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
      {/* Камера на весь экран */}
      {isCameraActive && (
        <div className="camera-fullscreen">
          {/* Рамка показывается только когда снимок НЕ сделан */}
          {!capturedImage && (
            <div className="camera-frame">
              <div className="frame-guide"></div>
              {/* Статус обнаружения */}
              <div className="detection-status">
                {detectionStatus}
              </div>
            </div>
          )}
          
          {!capturedImage ? (
            <>
              <Webcam
                audio={false}
                ref={cameraRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: 'environment',
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                }}
                className="camera-preview-fullscreen"
              />
              {/* Индикатор загрузки модели */}
              {!modelLoaded && (
                <div className="model-loading">
                  Загрузка системы распознавания...
                </div>
              )}
            </>
          ) : (
            <div className="preview-fullscreen">
              <img src={capturedImage} alt="Captured document" className="captured-image-fullscreen" />
            </div>
          )}
          {/* Кнопка закрытия */}
          <button onClick={handleCloseCamera} className="close-camera-btn-fullscreen">✗</button>
          {/* Управление для превью */}
        </div>
      )}

      {/* Основной контент профиля */}
      <div className="profile-card">
        <div className="profile-image">
          <div className="image-placeholder">
            <img src={telegramUser.photo_url} alt="Avatar" />
          </div>
        </div>
        
        <div>
          <h3 className="profile-name">
            {userData?.full_name || `${telegramUser?.first_name} ${telegramUser?.last_name || ''}`}
          </h3>
          
          <div className="scan-section">
            <button onClick={handleScanClick} className="scan-btn">
              📷 Сканировать документ
            </button>
          </div>
          
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