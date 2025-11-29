// components/UserProfile.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Webcam from 'react-webcam';
import { useUser } from '../contexts/UserContext';
import { useAdvancedDocumentDetector } from '../hooks/useOpneCvDocumentDetector';

const PersonalCabinet = () => {
  const { userData, telegramUser } = useUser();
  const cameraRef = useRef(null);
  const canvasRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false)
  const { capturePhoto, detectionResult}  = useAdvancedDocumentDetector(cameraRef, canvasRef)
  // const { detect, initialize, cleanup, isInitialized } = usePassportDetector();

  useEffect(() => {6 
    if (isCameraActive) {
      setInterval(()=>{
        capturePhoto();
        console.log("это паспорт на", detectionResult)
      }, 500)
    } else {
      console.log('Стоп обнаружения документа');
    }
    return () => {
      console.log('Стоп обнаружения документа');
    };
  }, [isCameraActive, detectionResult, capturePhoto]);


  useEffect(() => {
    if(!canvasRef.current){
      canvasRef.current = document.createElement('canvas');
    }
  }, []);

  const handleScanClick = () => {
      setIsCameraActive(true)
  };

  const handleCloseCamera = () => {
    setIsCameraActive(false)
   
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
            <div className="camera-frame">
              <div className="frame-guide"></div>
            </div>
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
          <button onClick={handleCloseCamera} className="close-camera-btn-fullscreen">✗</button>
          <div className='detect-status'>{detectionResult ? `${detectionResult.probability}` : 'null'}</div>
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
              Сканировать документ
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