// components/DocumentProcessor.js
/*
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import useWebSocket from '../hooks/useWebSocket';

const DocumentProcessor = () => {
  const {isConnected, connect, disconnect, sendMessage} = useWebSocket('7052499758');
  const currentIntervalRef = useRef(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const clear = useCallback(() => {
    if(currentIntervalRef.current){
      clearInterval(currentIntervalRef.current);
      currentIntervalRef.current = null;
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    if (webcamRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const video = webcamRef.current.video;
      if (!video.videoWidth || !video.videoHeight) {
        return null;
      }
      const startX = (video.videoWidth - canvas.width) / 2;
      const startY = (video.videoHeight - canvas.height) / 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        video, 
        startX, startY, canvas.width, canvas.height, 
        0, 0, canvas.width, canvas.height
      );
      return await new Promise((resolve) => {
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          0.9
        );
      });
    }
    return null;
  }, []);

  const sendPhoto = useCallback(async () => {
      capturePhoto().then((blob)=> {
        console.log(blob);
        sendMessage(blob);
      });
  }, [capturePhoto, isConnected, sendMessage]);

  useEffect(() => {
    // Создаем canvas если еще не создан
    if (!canvasRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = 350;
      canvas.height = 490;
      canvasRef.current = canvas;
    }
    
    // Подключаемся к WebSocket с задержкой
    const connectTimeout = setTimeout(() => {
      if (!isConnected) {
        connect();
      }
    }, 500);

    // Запускаем интервал для отправки фото
    currentIntervalRef.current = setInterval(sendPhoto, 500);

    return () => {
      clearTimeout(connectTimeout);
      disconnect();
      clear();
    };
  }, []);

  return (
    <div className="document-processor">
      <div className="camera-fullscreen">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }}
          className="webcam-video"
          onUserMedia={() => console.log('Камера готова')}
          onUserMediaError={(error) => console.error('Ошибка камеры:', error)}
        />
        <div className="camera-overlay">
          <div className="frame-guide"></div>
          <div className="frame-instruction">
            Поместите документ в рамку
          </div>
        </div>
        <div className="camera-controls">
          <button 
            className="capture-button"
            onClick={sendPhoto}
          >
            📸 Сделать фото
          </button>
          <div className="connection-status">
            Статус: {isConnected ? 'Подключено' : 'Отключено'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentProcessor;*/