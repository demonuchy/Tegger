import { useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import { createWorker } from 'tesseract.js';

const usePassportDetector = () => {
  const modelRef = useRef(null);
  const workerRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Инициализация всех компонентов
  const initialize = useCallback(async () => {
    if (isInitializedRef.current) return true;

    try {
      // Загрузка TensorFlow модели для детекции лица
      console.log('Загрузка TensorFlow модели...');
      modelRef.current = await tf.loadGraphModel('https://tfhub.dev/tensorflow/tfjs-model/ssd_mobilenet_v2/1/default/1');
      
      // Инициализация Tesseract
      console.log('Инициализация Tesseract...');
      workerRef.current = await createWorker('rus+eng', 1, {
        logger: m => console.log(m)
      });
      
      isInitializedRef.current = true;
      console.log('Все компоненты инициализированы');
      return true;
    } catch (error) {
      console.error('Ошибка инициализации:', error);
      return false;
    }
  }, []);

  // 1. OpenCV обработка - поиск прямоугольной формы
  const opencvProcess = useCallback((image) => {
    return new Promise((resolve) => {
      try {
        const src = cv.imread(image);
        const gray = new cv.Mat();
        const binary = new cv.Mat();
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();

        // Конвертация в grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        
        // Бинаризация
        cv.adaptiveThreshold(
          gray,
          binary,
          255,
          cv.ADAPTIVE_THRESH_GAUSSIAN_C,
          cv.THRESH_BINARY_INV,
          15,
          10
        );

        // Поиск контуров
        cv.findContours(
          binary, 
          contours, 
          hierarchy, 
          cv.RETR_TREE,     
          cv.CHAIN_APPROX_TC89_L1
        );

        let bestContour = null;
        let maxArea = 0;
        let shapeScore = 0;

        // Анализ контуров
        for (let i = 0; i < contours.size(); i++) {
          const contour = contours.get(i);
          const area = cv.contourArea(contour);
          
          if (area > maxArea) {
            const perimeter = cv.arcLength(contour, true);
            const approx = new cv.Mat();
            cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);
            
            // Проверяем что это прямоугольник (4 угла)
            if (approx.rows === 4) {
              const aspectRatio = this.calculateAspectRatio(approx);
              // Паспорт обычно имеет соотношение сторон ~1.4-1.6
              if (aspectRatio > 1.3 && aspectRatio < 1.7) {
                bestContour = approx;
                maxArea = area;
                // Вычисляем score на основе "прямоугольности"
                shapeScore = this.calculateRectangularity(contour, approx);
              }
            }
            approx.delete();
          }
          contour.delete();
        }

        // Очистка памяти
        src.delete();
        gray.delete();
        binary.delete();
        contours.delete();
        hierarchy.delete();

        resolve({
          isRectangle: bestContour !== null,
          contour: bestContour,
          shapeScore: shapeScore,
          area: maxArea
        });

      } catch (error) {
        console.error('OpenCV processing error:', error);
        resolve({ isRectangle: false, shapeScore: 0, area: 0 });
      }
    });
  }, []);

  // Вспомогательная функция для расчета соотношения сторон
  const calculateAspectRatio = useCallback((approx) => {
    const points = approx.data32S;
    const widths = [];
    const heights = [];

    for (let i = 0; i < 4; i++) {
      const nextI = (i + 1) % 4;
      const width = Math.abs(points[i * 2] - points[nextI * 2]);
      const height = Math.abs(points[i * 2 + 1] - points[nextI * 2 + 1]);
      widths.push(width);
      heights.push(height);
    }

    const avgWidth = widths.reduce((a, b) => a + b) / widths.length;
    const avgHeight = heights.reduce((a, b) => a + b) / heights.length;
    
    return Math.max(avgWidth, avgHeight) / Math.min(avgWidth, avgHeight);
  }, []);

  // Вспомогательная функция для расчета "прямоугольности"
  const calculateRectangularity = useCallback((contour, approx) => {
    const contourArea = cv.contourArea(contour);
    const rect = cv.boundingRect(approx);
    const rectArea = rect.width * rect.height;
    
    return contourArea / rectArea; // Чем ближе к 1, тем более прямоугольный
  }, []);

  // 2. TensorFlow обработка - поиск лица
  const tensorflowProcess = useCallback(async (image) => {
    if (!modelRef.current) {
      console.warn('TensorFlow модель не загружена');
      return { hasFace: false, faceScore: 0 };
    }

    try {
      // Конвертация изображения в tensor
      const tensor = tf.browser.fromPixels(image)
        .resizeNearestNeighbor([320, 320])
        .toFloat()
        .expandDims(0);

      // Детекция объектов
      const predictions = await modelRef.current.executeAsync(tensor);
      const boxes = await predictions[0].array();
      const scores = await predictions[1].array();

      // Поиск лица (class 1 в SSD MobileNet)
      let maxFaceScore = 0;
      for (let i = 0; i < scores[0].length; i++) {
        if (scores[0][i] > maxFaceScore && boxes[0][i][0] === 1) {
          maxFaceScore = scores[0][i];
        }
      }

      // Очистка памяти
      tensor.dispose();
      predictions.forEach(t => t.dispose());

      return {
        hasFace: maxFaceScore > 0.5,
        faceScore: maxFaceScore
      };

    } catch (error) {
      console.error('TensorFlow processing error:', error);
      return { hasFace: false, faceScore: 0 };
    }
  }, []);

  // 3. Tesseract обработка - распознавание текста
  const tesseractProcess = useCallback(async (image) => {
    if (!workerRef.current) {
      console.warn('Tesseract не инициализирован');
      return { text: '', confidence: 0 };
    }

    try {
      // Конвертация canvas в blob
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      
      canvas.toBlob(async (blob) => {
        const { data: { text, confidence } } = await workerRef.current.recognize(blob);
        
        return {
          text: text.trim(),
          confidence: confidence / 100
        };
      }, 'image/jpeg', 0.9);

    } catch (error) {
      console.error('Tesseract processing error:', error);
      return { text: '', confidence: 0 };
    }
  }, []);

  // Главная функция детекции
  const detect = useCallback(async (cameraRef, canvasRef) => {
    if (!cameraRef.current || !canvasRef.current) {
      throw new Error('cameraRef и canvasRef обязательны');
    }

    // Инициализация при первом вызове
    if (!isInitializedRef.current) {
      const initialized = await initialize();
      if (!initialized) {
        throw new Error('Не удалось инициализировать компоненты распознавания');
      }
    }

    try {
      const video = cameraRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Устанавливаем размеры canvas как у video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Рисуем текущий кадр с видео на canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Создаем ImageData для обработки
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.putImageData(imageData, 0, 0);

      // Запускаем все три анализа параллельно
      const [shapeResult, faceResult, textResult] = await Promise.all([
        opencvProcess(tempCanvas),
        tensorflowProcess(tempCanvas),
        tesseractProcess(tempCanvas)
      ]);

      // Вычисляем общий score паспорта
      const passportScore = this.calculatePassportScore(shapeResult, faceResult, textResult);

      return {
        passportScore: passportScore,
        shapeAnalysis: shapeResult,
        faceAnalysis: faceResult,
        textAnalysis: textResult,
        isPassport: passportScore > 0.6, // Пороговое значение
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Detection error:', error);
      throw error;
    }
  }, [initialize, opencvProcess, tensorflowProcess, tesseractProcess]);

  // Расчет общего score паспорта
  const calculatePassportScore = useCallback((shape, face, text) => {
    let totalScore = 0;
    let weightSum = 0;

    // Форма (40% веса)
    if (shape.isRectangle) {
      totalScore += shape.shapeScore * 0.4;
      weightSum += 0.4;
    }

    // Лицо (35% веса)
    if (face.hasFace) {
      totalScore += face.faceScore * 0.35;
      weightSum += 0.35;
    }

    // Текст (25% веса)
    if (text.confidence > 0.3) {
      totalScore += text.confidence * 0.25;
      weightSum += 0.25;
    }

    // Нормализуем score если не все компоненты найдены
    return weightSum > 0 ? totalScore / weightSum : 0;
  }, []);

  // Очистка ресурсов
  const cleanup = useCallback(async () => {
    if (workerRef.current) {
      await workerRef.current.terminate();
    }
    if (modelRef.current) {
      modelRef.current.dispose();
    }
    isInitializedRef.current = false;
  }, []);

  return {
    detect,
    initialize,
    cleanup,
    isInitialized: isInitializedRef.current
  };
};

export default usePassportDetector;