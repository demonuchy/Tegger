// components/UserProfile.js
import React, { useState, useEffect, useCallback, useRef, } from 'react';
import Webcam from 'react-webcam';
import { useUser } from '../contexts/UserContext';


const PersonalCabinet = () => {
  const { userData, telegramUser } = useUser();
  const cameraRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(null);
  const canvasRef = useRef(null)
  const resultRef = useRef({
    text: '',
    confidence: 0,
    shape: null,
    timestamp: null
  });
  const [isLongPress, setIsLongPress] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false)
  const touchTimer = useRef(null);
  const touchStartTime = useRef(0);

  

  const handleTouchStart = (e) => {
    e.preventDefault(); // Предотвращаем стандартное поведение (зум и т.д.)
    touchStartTime.current = Date.now();
    
    // Запускаем таймер для долгого нажатия (500ms)
    touchTimer.current = setTimeout(() => {
      setIsLongPress(true);
      console.log('Долгое нажатие!');
      // Выполняем действие для долгого нажатия
      onLongPressAction();
    }, 500);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
    }
    
    const pressDuration = Date.now() - touchStartTime.current;
    
    // Если было короткое нажатие (< 500ms)
    if (pressDuration < 500 && !isLongPress) {
      console.log('Короткое нажатие');
      // Выполняем действие для короткого нажатия
      onClickAction();
    }
    
    setIsLongPress(false);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    // Если палец сдвинулся, отменяем долгое нажатие
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
  };

  const onLongPressAction = useCallback(() => {
    if(isEditMode){
      setIsEditMode(false)
      return;
    }
    setIsEditMode(true)
  },[isEditMode, setIsEditMode]);

  const onClickAction = () => {
    console.log('short tach')
  };


  const handleScanClick = useCallback(() => {
    // setIsCameraActive(true)
    alert('Функция пока что не доступна')
  }, [setIsCameraActive])
  const handleCloseCamera = useCallback(()=>{setIsCameraActive(false)}, [setIsCameraActive])

  const processImage = () => {
    if (!window.cv || !cameraRef.current?.video) {
      console.error('OpenCV не загружен или камера не доступна');
      return null;
    }
  
    const canvas = canvasRef.current;
    const cv = window.cv;
    const ctx = canvas.getContext('2d');
    const video = cameraRef.current.video;
    
    // Захватываем область рамки
    const startX = (video.videoWidth - 350) / 2;
    const startY = (video.videoHeight - 490) / 2;
    canvas.width = 350;
    canvas.height = 490;
    ctx.drawImage(video, startX, startY, 350, 490, 0, 0, 350, 490);
    const imgData = ctx.getImageData(0, 0, 350, 490);
    const src = cv.matFromImageData(imgData);
    const originalImage = new cv.Mat();
    src.copyTo(originalImage);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  }
  
  const handleProcessImage = () => {
    const result = processImage();
    if (result) {
      resultRef.current = {
        ...result,
        timestamp: Date.now()
      };
      console.log('📝 Распознанный текст:', result.text);
      console.log('🎯 Уверенность:', result.confidence);
      console.log('📐 Форма:', result.shape);
    }
  };

  useEffect(() =>{
   
    if(isCameraActive){
      setInterval(()=>{
        handleProcessImage();
      }, 700)
    }
  }, [isCameraActive])


  useEffect(() => {
    if(!canvasRef.current){
      canvasRef.current = document.createElement('canvas')
    }
  }, [])

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
    {/*  
      {isCameraActive && (
        <div className="camera-fullscreen">
          
          <div className="camera-frame"></div>
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
        </div>
      ) */}
    
      <div 
        className="profile-card"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        >
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
          
          <div className={`info-block-wrapper ${isEditMode ? 'edit-mode' : ''}`}>
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

          <div className={`info-block-wrapper ${isEditMode ? 'edit-mode' : ''}`}>
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

          <div className={`info-block-wrapper ${isEditMode ? 'edit-mode' : ''}`}>
            <h4>Личные</h4>
            <div className="info-block">
              <div className="info-row">
                <span className="info-label">ФИО:</span>
                <span className="info-content">{userData.full_name || 'Не доступно'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Username:</span>
                <span className="info-content">{'Не указан'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalCabinet;