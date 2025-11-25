import { useState, useCallback, useRef, useEffect } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export const useDocumentScanner = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const cameraRef = useRef(null);
  const [model, setModel] = useState(null);
  const detectionIntervalRef = useRef(null);
  const [onDocumentDetected, setOnDocumentDetected] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('🔄 Загрузка модели компьютерного зрения...');
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        console.log('✅ Модель загружена успешно');
      } catch (error) {
        console.error('❌ Ошибка загрузки модели:', error);
      }
    };
    loadModel();
  }, []);

  const startCamera = useCallback((onDetectedCallback = null) => {
    console.log('📷 Запуск камеры');
    setIsCameraActive(true);
    if (onDetectedCallback) {
      setOnDocumentDetected(() => onDetectedCallback);
    }
  }, []);

  const stopCamera = useCallback(() => {
    console.log('🛑 Остановка камеры');
    setIsCameraActive(false);
    setOnDocumentDetected(null);
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  // НОВАЯ ФУНКЦИЯ: Захват только области рамки
  const captureFrameArea = useCallback(() => {
    if (cameraRef.current && cameraRef.current.video) {
      try {
        const video = cameraRef.current.video;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Размеры области рамки (совпадают с CSS)
        const frameWidth = 350;
        const frameHeight = 250;
        
        // Позиция рамки (центр экрана)
        const frameX = (video.videoWidth - frameWidth) / 2;
        const frameY = (video.videoHeight - frameHeight) / 2;
        
        // Настраиваем canvas под размер рамки
        canvas.width = frameWidth;
        canvas.height = frameHeight;
        
        // Рисуем только область рамки
        ctx.drawImage(
          video, 
          frameX, frameY, frameWidth, frameHeight, // source: область из видео
          0, 0, frameWidth, frameHeight            // destination: весь canvas
        );
        
        // Конвертируем в base64
        const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
        console.log('✅ Область рамки захвачена успешно');
        return imageSrc;
      } catch (error) {
        console.error('❌ Ошибка при захвате области рамки:', error);
        return null;
      }
    }
    console.warn('⚠️ Camera ref не доступен');
    return null;
  }, []);

  // Функция для обнаружения документа в рамке
  const startDocumentDetection = useCallback(() => {
    console.log('🔍 Запуск обнаружения документа');
    
    if (!model) {
      console.log('❌ Модель не загружена');
      return;
    }
    
    if (!cameraRef.current || !cameraRef.current.video) {
      console.log('❌ Камера не готова');
      return;
    }

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    detectionIntervalRef.current = setInterval(async () => {
      try {
        const video = cameraRef.current.video;
        if (!video || video.readyState !== 4) {
          console.log('⏳ Видео не готово');
          return;
        }

        console.log('🎯 Анализ кадра...');
        const predictions = await model.detect(video);
        console.log('📊 Найдено объектов:', predictions.length);
        
        if (predictions.length > 0) {
          console.log('📋 Объекты:', predictions.map(p => `${p.class} (${Math.round(p.score * 100)}%)`));
        }
        
        // РАСШИРЕННЫЙ список объектов для обнаружения
        const documentLikeObjects = predictions.filter(pred => 
          ['book', 'laptop', 'cell phone'].includes(pred.class) && 
          pred.score > 0.6
        );

        console.log('📄 Подходящие объекты (60%+):', documentLikeObjects.length);

        if (documentLikeObjects.length > 0) {
          const bestMatch = documentLikeObjects[0];
          console.log('🎯 Лучший кандидат:', bestMatch.class, `(${Math.round(bestMatch.score * 100)}%)`);
          
          const inFrame = isObjectInFrame(bestMatch, video);
          console.log('🎯 В рамке:', inFrame);
          
          if (inFrame) {
            console.log('✅ Объект обнаружен в рамке!');
            const image = captureFrameArea(); // ИСПОЛЬЗУЕМ НОВУЮ ФУНКЦИЮ
            if (image && onDocumentDetected) {
              console.log('🖼️ Передача обрезанного изображения в callback');
              onDocumentDetected(image);
              stopDocumentDetection();
            }
          } else {
            console.log('📍 Объект не в рамке, но уверенность:', Math.round(bestMatch.score * 100) + '%');
          }
        } else {
          console.log('🔍 Нет подходящих объектов');
        }
      } catch (error) {
        console.error('❌ Ошибка обнаружения:', error);
      }
    }, 1500); 
  }, [model, captureFrameArea, onDocumentDetected]);

  const stopDocumentDetection = useCallback(() => {
    console.log('🛑 Остановка обнаружения');
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  const isObjectInFrame = (prediction, video) => {
    const [x, y, width, height] = prediction.bbox;
    const targetZone = {
      x: (video.videoWidth - 350) / 2,
      y: (video.videoHeight - 250) / 2,
      width: 350,
      height: 250
    };

    // СМЯГЧЕННЫЕ КРИТЕРИИ ПОЗИЦИИ
    const isInZone = 
      x >= targetZone.x - 60 &&
      y >= targetZone.y - 60 &&
      x + width <= targetZone.x + targetZone.width + 60 &&
      y + height <= targetZone.y + targetZone.height + 60;

    const aspectRatio = width / height;
    const zoneArea = targetZone.width * targetZone.height;
    const objectArea = width * height;
    const coverage = objectArea / zoneArea;

    // СМЯГЧЕННЫЕ РАСЧЕТЫ СОВПАДЕНИЯ
    const zoneMatch = calculateZoneMatch(x, y, width, height, targetZone);
    const aspectMatch = calculateAspectMatch(aspectRatio);
    const sizeMatch = calculateSizeMatch(coverage);
    
    const totalMatch = (zoneMatch + aspectMatch + sizeMatch) / 3;
    const isHighMatch = totalMatch >= 0.5;

    console.log(`🎯 Детальный анализ:`);
    console.log(`   📍 Позиция: x=${Math.round(x)}, y=${Math.round(y)}`);
    console.log(`   📏 Размер: ${Math.round(width)}x${Math.round(height)}`);
    console.log(`   🎯 В зоне: ${isInZone} (${Math.round(zoneMatch * 100)}%)`);
    console.log(`   📐 Пропорции: ${aspectRatio.toFixed(2)} (${Math.round(aspectMatch * 100)}%)`);
    console.log(`   📊 Покрытие: ${(coverage * 100).toFixed(1)}% (${Math.round(sizeMatch * 100)}%)`);
    console.log(`   🎯 ОБЩЕЕ СОВПАДЕНИЕ: ${Math.round(totalMatch * 100)}%`);
    console.log(`   🎯 Итог: ${isHighMatch ? '✅ ОБНАРУЖЕН (>50%)' : '❌ НЕДОСТАТОЧНО'}`);
    
    return isHighMatch;
  };

  const calculateZoneMatch = (x, y, width, height, targetZone) => {
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const targetCenterX = targetZone.x + targetZone.width / 2;
    const targetCenterY = targetZone.y + targetZone.height / 2;
    
    const distanceX = Math.abs(centerX - targetCenterX);
    const distanceY = Math.abs(centerY - targetCenterY);
    
    const maxDistanceX = targetZone.width / 2 + 60;
    const maxDistanceY = targetZone.height / 2 + 60;
    
    const matchX = Math.max(0, 1 - distanceX / maxDistanceX);
    const matchY = Math.max(0, 1 - distanceY / maxDistanceY);
    
    return (matchX + matchY) / 2;
  };

  const calculateAspectMatch = (aspectRatio) => {
    const idealAspect = 1.4; 
    const deviation = Math.abs(aspectRatio - idealAspect);
    const maxDeviation = 1.0;
    
    return Math.max(0, 1 - deviation / maxDeviation);
  };

  const calculateSizeMatch = (coverage) => {
    const idealCoverage = 0.7;
    const deviation = Math.abs(coverage - idealCoverage);
    const maxDeviation = 0.8;
    
    return Math.max(0, 1 - deviation / maxDeviation);
  };

  return {
    isCameraActive,
    cameraRef,
    startCamera,
    stopCamera,
    capturePhoto: captureFrameArea,
    startDocumentDetection,
    stopDocumentDetection,
    modelLoaded: !!model
  };
};