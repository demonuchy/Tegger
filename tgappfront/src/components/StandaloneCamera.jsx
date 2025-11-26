// components/StandaloneCamera.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

const StandaloneCamera = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(null)
  const webcamRef = useRef(null);
  const analysInterval = useRef(null);
  const cavansRef = useRef(null)
 

  const startCamera = useCallback(() => {
    setIsCameraActive(true);
    setCapturedImage(null);
  }, []);

  const stopCamera = useCallback(() => {
    setIsCameraActive(false);
    if(analysInterval.current){
        clearInterval(analysInterval.current)
        analysInterval.current = null
    }
  }, []);

  const getCurrentFrame = useCallback(() => {
    if(webcamRef.current && isCameraActive){
        webcamRef.current.getScreenshot();
        const imageSrc = webcamRef.current.getScreenshot();
        const currentImg = new Image();
        setCurrentFrame(imageSrc)
        currentImg.onload =  () => {
            const canvas = cavansRef.current;
            const imgContext = canvas.getContext('2d');
            const FRAME_HIGHT = 490;
            const FRAME_WIDTH = 350;
            imgContext.drawImage(currentImg, 0,0); 
            const startFrameX = (canvas.width - FRAME_WIDTH) / 2;  // X по горизонтали (от ширины)
            const startFrameY = (canvas.height - FRAME_HIGHT) / 2; // Y по вертикали (от высоты)
            const imageData = imgContext.getImageData(startFrameX, startFrameY, FRAME_WIDTH, FRAME_HIGHT);
            const { width, height, data } = imageData;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = (y * width + x) * 4;
                    const r = data[index];     // Красный
                    const g = data[index + 1]; // Зеленый
                    const b = data[index + 2]; // Синий
                    const a = data[index + 3]; // Альфа
                    console.log(`Пиксель (${x}, ${y}): RGB(${r}, ${g}, ${b})`);
                }
            }
        }
        currentImg.src = imageSrc;
    }

  },[setCurrentFrame, isCameraActive])

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
    }
  }, []);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  // Скачивание фото
  const downloadPhoto = useCallback(() => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = 'document-photo.jpg';
      link.click();
    }
  }, [capturedImage]);

  useEffect(()=>{
    cavansRef.current = document.createElement('canvas')
  },[])

  useEffect(()=>{
    if(isCameraActive){
        if(analysInterval.current){
            clearTimeout(analysInterval.current)
            analysInterval.current = null
        }
        analysInterval.current = setInterval(() => {
            getCurrentFrame();
          }, 10000);
          getCurrentFrame();
    }
  }, [isCameraActive])

  return (
    <div className="standalone-camera-page">
      {/* Полноэкранная камера */}
      {isCameraActive && (
        <div className="camera-fullscreen">
          {!capturedImage ? (
            <>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{
                  facingMode: 'environment',
                  width: { ideal: 1920 },
                  height: { ideal: 1080 }
                }}
                className="webcam-fullscreen"
              />
              
              {/* Рамка документа */}
              <div className="frame-overlay-fullscreen">
                <div className="frame-guide-fullscreen"></div>
                <div className="frame-instruction-fullscreen">
                  Поместите документ в рамку
                </div>
              </div>

              {/* Кнопки управления */}
              <div className="camera-controls-fullscreen">
                <button 
                  onClick={capturePhoto}
                  className="capture-btn-fullscreen"
                >
                  📷 Сфотографировать
                </button>
                <button 
                  onClick={stopCamera}
                  className="stop-camera-btn-fullscreen"
                >
                  ❌ Закрыть камеру
                </button>
              </div>
            </>
          ) : (
            <div className="preview-fullscreen">
              <img 
                src={capturedImage} 
                alt="Captured document" 
                className="captured-image-fullscreen"
              />
              <div className="photo-controls-fullscreen">
                <button 
                  onClick={downloadPhoto}
                  className="download-btn-fullscreen"
                >
                  💾 Скачать фото
                </button>
                <button 
                  onClick={retakePhoto}
                  className="retake-btn-fullscreen"
                >
                  🔄 Снять заново
                </button>
                <button 
                  onClick={stopCamera}
                  className="close-btn-fullscreen"
                >
                  ✅ Готово
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Главная страница (только когда камера закрыта) */}
      {!isCameraActive && (
        <div className="camera-container">
          <h1>📷 Сканирование документов</h1>
          <p>Сфотографируйте ваш документ для дальнейшей обработки</p>

          <div className="camera-start-section">
            <button 
              onClick={startCamera}
              className="start-camera-btn"
            >
              📸 Открыть камеру
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandaloneCamera;