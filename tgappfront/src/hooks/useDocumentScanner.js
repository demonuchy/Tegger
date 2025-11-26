// hooks/useDocumentScanner.js
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

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ: Захват только области рамки с правильными размерами
  const captureFrameArea = useCallback(() => {
    if (cameraRef.current && cameraRef.current.video) {
      try {
        const video = cameraRef.current.video;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // ИЗМЕНЕННЫЕ РАЗМЕРЫ: высота и длина поменяны местами ×1.4
        const frameWidth = 350;  // Было 350
        const frameHeight = 490; // Было 250 (350 × 1.4 = 490)
        
        // Позиция рамки (центр экрана)
        const frameX = (video.videoWidth - frameWidth) / 2;
        const frameY = (video.videoHeight - frameHeight) / 2;
        
        // Настраиваем canvas под размер рамки
        canvas.width = frameWidth;
        canvas.height = frameHeight;
        
        // Рисуем только область рамки
        ctx.drawImage(
          video, 
          frameX-60, frameY-60, frameWidth+60, frameHeight+60, // source: область из видео
          0, 0, frameWidth, frameHeight            // destination: весь canvas
        );
        
        // Конвертируем в base64
        const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
        console.log('✅ Область рамки захвачена успешно', { width: frameWidth, height: frameHeight, x : frameX, y : frameY });
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
            const image = captureFrameArea();
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
    }, 200); 
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
    
    // ИЗМЕНЕННЫЕ РАЗМЕРЫ ЦЕЛЕВОЙ ЗОНЫ
    const targetZone = {
      x: (video.videoWidth - 350) / 2,   // Ширина
      y: (video.videoHeight - 490) / 2,  // Высота (увеличена в 1.4 раза)
      width: 350,
      height: 490
    };

    // СМЯГЧЕННЫЕ КРИТЕРИИ ПОЗИЦИИ
    const isInZone = 
      x >= targetZone.x - 20 && // Увеличили допуск для новой высоты
      y >= targetZone.y - 20 &&
      x + width <= targetZone.x + targetZone.width + 20 &&
      y + height <= targetZone.y + targetZone.height + 20;

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
    
    const maxDistanceX = targetZone.width / 2 + 20; // Увеличили для новой высоты
    const maxDistanceY = targetZone.height / 2 + 20;
    
    const matchX = Math.max(0, 1 - distanceX / maxDistanceX);
    const matchY = Math.max(0, 1 - distanceY / maxDistanceY);
    
    return (matchX + matchY) / 2;
  };

  const calculateAspectMatch = (aspectRatio) => {
    const idealAspect = 0.714; // 350/490 = 0.714 (обратное соотношение 1.4:1)
    const deviation = Math.abs(aspectRatio - idealAspect);
    const maxDeviation = 0.5;
    
    return Math.max(0, 1 - deviation / maxDeviation);
  };

  const calculateSizeMatch = (coverage) => {
    const idealCoverage = 0.5; // Уменьшили идеальное покрытие для высокой рамки
    const deviation = Math.abs(coverage - idealCoverage);
    const maxDeviation = 0.6;
    
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

















// hooks/useSimpleDocumentDetection.js
import { useState, useCallback, useRef, useEffect } from 'react';

export const useSimpleDocumentDetection = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const cameraRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const [detectedObjects, setDetectedObjects] = useState([]);

  const startCamera = useCallback(() => {
    console.log('📷 Запуск камеры с простым детектором');
    setIsCameraActive(true);
    
    setTimeout(() => {
      startSimpleDetection();
    }, 1000);
  }, []);

  const stopCamera = useCallback(() => {
    console.log('🛑 Остановка камеры');
    setIsCameraActive(false);
    stopDetection();
  }, []);

  const startSimpleDetection = useCallback(() => {
    if (!cameraRef.current || !cameraRef.current.video) {
      console.log('❌ Камера не готова');
      return;
    }

    // Создаем скрытый canvas для анализа
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    detectionIntervalRef.current = setInterval(() => {
      try {
        const video = cameraRef.current.video;
        if (!video || video.readyState !== 4) return;

        analyzeFrame(video);
      } catch (error) {
        console.error('❌ Ошибка анализа:', error);
      }
    }, 1000); // Анализируем каждый секунду
  }, []);

  const analyzeFrame = (video) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Устанавливаем размеры canvas как у видео
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Рисуем текущий кадр видео на canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Получаем данные изображения
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Анализируем кадр
    const analysis = analyzeImageData(data, canvas.width, canvas.height);
    
    // Выводим результаты в консоль
    if (analysis.objects.length > 0) {
      console.log('🎯 Обнаружены объекты:', analysis.objects);
      setDetectedObjects(analysis.objects);
    }
  };

  const analyzeImageData = (data, width, height) => {
    const objects = [];
    
    // 1. Обнаружение контрастных областей
    const contrastAreas = findContrastAreas(data, width, height);
    
    // 2. Обнаружение прямоугольных форм
    const rectangles = findRectangles(data, width, height);
    
    // 3. Обнаружение однородных цветовых областей
    const uniformAreas = findUniformAreas(data, width, height);
    
    // Комбинируем результаты
    if (contrastAreas.length > 0) {
      objects.push({
        type: 'contrast_area',
        count: contrastAreas.length,
        confidence: Math.min(contrastAreas.length * 10, 90)
      });
    }
    
    if (rectangles.length > 0) {
      objects.push({
        type: 'rectangle',
        count: rectangles.length,
        confidence: Math.min(rectangles.length * 15, 95)
      });
    }
    
    if (uniformAreas.length > 0) {
      objects.push({
        type: 'uniform_area', 
        count: uniformAreas.length,
        confidence: Math.min(uniformAreas.length * 12, 85)
      });
    }
    
    return { objects };
  };

  const findContrastAreas = (data, width, height) => {
    const areas = [];
    const blockSize = 20; // Размер блока для анализа
    const contrastThreshold = 50; // Порог контраста
    
    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        const contrast = calculateBlockContrast(data, width, x, y, blockSize);
        if (contrast > contrastThreshold) {
          areas.push({ x, y, contrast });
        }
      }
    }
    
    return areas;
  };

  const calculateBlockContrast = (data, width, startX, startY, size) => {
    let minLuminance = 255;
    let maxLuminance = 0;
    
    for (let y = startY; y < startY + size; y++) {
      for (let x = startX; x < startX + size; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // Вычисляем luminance (яркость)
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        minLuminance = Math.min(minLuminance, luminance);
        maxLuminance = Math.max(maxLuminance, luminance);
      }
    }
    
    return maxLuminance - minLuminance;
  };

  const findRectangles = (data, width, height) => {
    const rectangles = [];
    
    // Упрощенный алгоритм поиска краев
    const edges = findEdges(data, width, height);
    
    // Ищем прямоугольные формы среди краев
    for (let edge of edges) {
      if (isRectangleLike(edge)) {
        rectangles.push(edge);
      }
    }
    
    return rectangles;
  };

  const findEdges = (data, width, height) => {
    const edges = [];
    const edgeThreshold = 30;
    
    for (let y = 1; y < height - 1; y += 3) { // Увеличили шаг для производительности
      for (let x = 1; x < width - 1; x += 3) {
        const gradient = calculateGradient(data, width, x, y);
        if (gradient > edgeThreshold) {
          edges.push({ x, y, gradient });
        }
      }
    }
    
    return edges;
  };

  const calculateGradient = (data, width, x, y) => {
    const index = (y * width + x) * 4;
    
    // Простой оператор Собеля для обнаружения краев
    let gradientX = 0;
    let gradientY = 0;
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const currentIndex = ((y + dy) * width + (x + dx)) * 4;
        const luminance = 0.299 * data[currentIndex] + 0.587 * data[currentIndex + 1] + 0.114 * data[currentIndex + 2];
        
        // Ядра Собеля
        gradientX += luminance * (dx === -1 ? -1 : dx === 1 ? 1 : dx === 0 ? 0 : 2 * dx);
        gradientY += luminance * (dy === -1 ? -1 : dy === 1 ? 1 : dy === 0 ? 0 : 2 * dy);
      }
    }
    
    return Math.sqrt(gradientX * gradientX + gradientY * gradientY);
  };

  const isRectangleLike = (edge) => {
    // Простая проверка - если есть достаточно краев в области, считаем прямоугольником
    return edge.gradient > 40;
  };

  const findUniformAreas = (data, width, height) => {
    const areas = [];
    const blockSize = 25;
    const uniformityThreshold = 15;
    
    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        const uniformity = calculateBlockUniformity(data, width, x, y, blockSize);
        if (uniformity < uniformityThreshold) {
          areas.push({ x, y, uniformity });
        }
      }
    }
    
    return areas;
  };

  const calculateBlockUniformity = (data, width, startX, startY, size) => {
    let totalLuminance = 0;
    let luminanceSquares = 0;
    let count = 0;
    
    for (let y = startY; y < startY + size; y += 2) {
      for (let x = startX; x < startX + size; x += 2) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuminance += luminance;
        luminanceSquares += luminance * luminance;
        count++;
      }
    }
    
    if (count === 0) return 100;
    
    const mean = totalLuminance / count;
    const variance = (luminanceSquares / count) - (mean * mean);
    
    return Math.sqrt(variance); // Стандартное отклонение - мера неоднородности
  };

  const stopDetection = useCallback(() => {
    console.log('🛑 Остановка обнаружения');
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return {
    isCameraActive,
    cameraRef,
    startCamera,
    stopCamera,
    detectedObjects
  };
};