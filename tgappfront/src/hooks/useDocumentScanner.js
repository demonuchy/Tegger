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
















/*
export const useOpenCvDocumentDetection = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const cameraRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const [detectedObjects, setDetectedObjects] = useState([]);
  const [isOpenCvReady, setIsOpenCvReady] = useState(false);

  // Константы для рамки документа
  const FRAME_WIDTH = 350;
  const FRAME_HEIGHT = 490;
  const FRAME_MARGIN = 40;

  // Инициализация OpenCV
  useEffect(() => {
    if (window.cv) {
      setIsOpenCvReady(true);
    } else {
      window.onOpenCvReady = () => {
        console.log('✅ OpenCV.js загружен');
        setIsOpenCvReady(true);
      };
    }
  }, []);

  const detectDocumentWithOpenCV = useCallback((ctx, width, height, frameX, frameY) => {
    if (!window.cv) {
      console.log('❌ OpenCV не загружен');
      return { objects: [] };
    }

    try {
      const src = new cv.Mat(height, width, cv.CV_8UC4);
      const frameRoi = new cv.Rect(frameX, frameY, FRAME_WIDTH, FRAME_HEIGHT);
      
      // Получаем изображение с canvas
      const imageData = ctx.getImageData(0, 0, width, height);
      src.data.set(imageData.data);
      
      // Работаем только с областью рамки
      const roi = src.roi(frameRoi);
      
      const objects = [];
      
      // 1. Обнаружение контуров
      const contours = findContoursWithOpenCV(roi);
      
      // 2. Анализ прямоугольников
      const rectangles = findRectanglesWithOpenCV(contours);
      
      // 3. Анализ текстуры и яркости
      const textureAnalysis = analyzeTextureWithOpenCV(roi);
      
      // 4. Сравнение с областью вокруг рамки
      const outerRoi = getOuterRoi(src, width, height, frameX, frameY);
      const comparison = compareAreasWithOpenCV(roi, outerRoi);
      
      // Формируем результаты
      if (rectangles.length > 0) {
        objects.push({
          type: 'rectangle_opencv',
          count: rectangles.length,
          confidence: Math.min(rectangles.length * 25, 95),
          rectangles: rectangles
        });
      }
      
      if (comparison.contrastDifference > 30) {
        objects.push({
          type: 'contrast_difference_opencv',
          confidence: Math.min(comparison.contrastDifference, 90),
          value: comparison.contrastDifference
        });
      }
      
      if (comparison.brightnessDifference > 20) {
        objects.push({
          type: 'brightness_difference_opencv',
          confidence: Math.min(comparison.brightnessDifference * 2, 85),
          value: comparison.brightnessDifference
        });
      }
      
      if (textureAnalysis.edgeDensity > 0.1) {
        objects.push({
          type: 'high_texture_opencv',
          confidence: Math.min(textureAnalysis.edgeDensity * 100, 80),
          density: textureAnalysis.edgeDensity
        });
      }
      
      // Освобождаем память
      src.delete();
      roi.delete();
      if (outerRoi) outerRoi.delete();
      contours.forEach(contour => contour.delete());
      
      return { objects };
      
    } catch (error) {
      console.error('❌ Ошибка OpenCV:', error);
      return { objects: [] };
    }
  }, [FRAME_WIDTH, FRAME_HEIGHT, FRAME_MARGIN]);

  const findContoursWithOpenCV = (src) => {
    const gray = new cv.Mat();
    const edges = new cv.Mat();
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    
    try {
      // Конвертируем в grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      
      // Гауссово размытие для уменьшения шума
      const blurred = new cv.Mat();
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
      
      // Детекция краев Canny
      cv.Canny(blurred, edges, 50, 150, 3, false);
      
      // Находим контуры
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
      
      // Копируем контуры для возврата
      const resultContours = [];
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        resultContours.push(contour);
      }
      
      return resultContours;
      
    } finally {
      // Освобождаем память
      gray.delete();
      edges.delete();
      hierarchy.delete();
    }
  };

  const findRectanglesWithOpenCV = (contours) => {
    const rectangles = [];
    const minArea = FRAME_WIDTH * FRAME_HEIGHT * 0.3; // Минимальная площадь 30% от рамки
    
    contours.forEach(contour => {
      const area = cv.contourArea(contour);
      
      if (area > minArea) {
        const approx = new cv.Mat();
        const epsilon = 0.02 * cv.arcLength(contour, true);
        
        // Аппроксимируем контур
        cv.approxPolyDP(contour, approx, epsilon, true);
        
        // Проверяем, является ли прямоугольником (4 угла)
        if (approx.rows === 4) {
          const rect = cv.boundingRect(approx);
          
          // Проверяем соотношение сторон (примерно как у документа)
          const aspectRatio = rect.width / rect.height;
          if (aspectRatio > 0.6 && aspectRatio < 1.4) {
            rectangles.push({
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              area: area,
              aspectRatio: aspectRatio,
              confidence: Math.min((area / (FRAME_WIDTH * FRAME_HEIGHT)) * 100, 95)
            });
          }
        }
        
        approx.delete();
      }
    });
    
    return rectangles;
  };

  const analyzeTextureWithOpenCV = (src) => {
    const gray = new cv.Mat();
    const edges = new cv.Mat();
    
    try {
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      
      // Оператор Лапласиана для анализа текстуры
      const laplacian = new cv.Mat();
      cv.Laplacian(gray, laplacian, cv.CV_64F);
      
      // Вычисляем дисперсию Лапласиана как меру текстуры
      const mean = new cv.Mat();
      const stddev = new cv.Mat();
      cv.meanStdDev(laplacian, mean, stddev);
      
      const textureValue = stddev.doubleAt(0, 0);
      
      // Детекция краев для плотности краев
      cv.Canny(gray, edges, 50, 150, 3, false);
      const edgePixels = cv.countNonZero(edges);
      const edgeDensity = edgePixels / (src.rows * src.cols);
      
      return {
        texture: textureValue,
        edgeDensity: edgeDensity
      };
      
    } finally {
      gray.delete();
      edges.delete();
    }
  };

  const getOuterRoi = (src, width, height, frameX, frameY) => {
    const outerX = Math.max(0, frameX - FRAME_MARGIN);
    const outerY = Math.max(0, frameY - FRAME_MARGIN);
    const outerWidth = Math.min(width - outerX, FRAME_WIDTH + (FRAME_MARGIN * 2));
    const outerHeight = Math.min(height - outerY, FRAME_HEIGHT + (FRAME_MARGIN * 2));
    
    if (outerWidth <= 0 || outerHeight <= 0) return null;
    
    const outerRect = new cv.Rect(outerX, outerY, outerWidth, outerHeight);
    return src.roi(outerRect);
  };

  const compareAreasWithOpenCV = (innerRoi, outerRoi) => {
    if (!outerRoi) return { contrastDifference: 0, brightnessDifference: 0 };
    
    const innerGray = new cv.Mat();
    const outerGray = new cv.Mat();
    
    try {
      cv.cvtColor(innerRoi, innerGray, cv.COLOR_RGBA2GRAY);
      cv.cvtColor(outerRoi, outerGray, cv.COLOR_RGBA2GRAY);
      
      // Сравниваем яркость
      const innerMean = cv.mean(innerGray);
      const outerMean = cv.mean(outerGray);
      const brightnessDifference = Math.abs(innerMean[0] - outerMean[0]);
      
      // Сравниваем контраст (стандартное отклонение)
      const innerStddev = new cv.Mat();
      const outerStddev = new cv.Mat();
      const innerMeanMat = new cv.Mat();
      const outerMeanMat = new cv.Mat();
      
      cv.meanStdDev(innerGray, innerMeanMat, innerStddev);
      cv.meanStdDev(outerGray, outerMeanMat, outerStddev);
      
      const contrastDifference = Math.abs(innerStddev.doubleAt(0, 0) - outerStddev.doubleAt(0, 0));
      
      return {
        brightnessDifference: brightnessDifference,
        contrastDifference: contrastDifference
      };
      
    } finally {
      innerGray.delete();
      outerGray.delete();
    }
  };

  const analyzeFrame = useCallback((video) => {
    if (!isOpenCvReady) {
      console.log('⏳ OpenCV загружается...');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Рисуем весь видео-кадр на canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Вычисляем координаты рамки по центру
    const frameX = (canvas.width - FRAME_WIDTH) / 2;
    const frameY = (canvas.height - FRAME_HEIGHT) / 2;
    
    // Используем OpenCV для анализа
    const analysis = detectDocumentWithOpenCV(ctx, canvas.width, canvas.height, frameX, frameY);
    
    if (analysis.objects.length > 0) {
      console.log('🎯 OpenCV обнаружены объекты:', analysis.objects);
      setDetectedObjects(analysis.objects);
    } else {
      setDetectedObjects([]);
    }
  }, [FRAME_WIDTH, FRAME_HEIGHT, detectDocumentWithOpenCV, isOpenCvReady]);

  // Остальные функции остаются такими же
  const startSimpleDetection = useCallback(() => {
    if (!cameraRef.current || !cameraRef.current.video) {
      console.log('❌ Камера не готова');
      return;
    }

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
    }, 1000);
  }, [analyzeFrame]);

  const stopDetection = useCallback(() => {
    console.log('🛑 Остановка обнаружения');
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  const startCamera = useCallback(() => {
    console.log('📷 Запуск камеры с OpenCV детектором');
    setIsCameraActive(true);
    
    setTimeout(() => {
      startSimpleDetection();
    }, 1000);
  }, [startSimpleDetection]);

  const stopCamera = useCallback(() => {
    console.log('🛑 Остановка камеры');
    setIsCameraActive(false);
    stopDetection();
  }, [stopDetection]);

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
    detectedObjects,
    isOpenCvReady
  };
};
*/