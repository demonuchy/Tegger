// hooks/useDocumentDetector.js
import { useState, useCallback, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import * as tf from '@tensorflow/tfjs';


export const useDocumentDetect = (webcamRef, canvasRef) => {
    const [detectionResult, setDetectionResult] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
   
    const showImage = (cv, cvMatObj) => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cvMatObj.cols;
        tempCanvas.height = cvMatObj.rows;
        cv.imshow(tempCanvas, cvMatObj);
        const dataUrl = tempCanvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
    };

    const calculatePassportProbability = (passportContour, innerContours, src, cv) => {
        let probability = 0;
        const features = [];
        
        // 1. Проверка размера основного контура (30%)
        const imageArea = src.rows * src.cols;
        const contourAreaRatio = passportContour.area / imageArea;
        if (contourAreaRatio > 0.7 && contourAreaRatio < 0.95) { // Исправлено: 70-95% от кадра
        probability += 30;
        features.push(`✓ Размер документа: ${(contourAreaRatio * 100).toFixed(1)}% от кадра`);
        } else {
        features.push(`✗ Неподходящий размер: ${(contourAreaRatio * 100).toFixed(1)}% от кадра`);
        }
        
        // 2. Проверка соотношения сторон (20%)
        const rect = cv.boundingRect(passportContour.contour);
        const aspectRatio = rect.width / rect.height;
        const idealAspectRatio = 88 / 125; // Стандартное соотношение паспорта РФ
        const aspectRatioDiff = Math.abs(aspectRatio - idealAspectRatio);
        
        if (aspectRatioDiff < 0.2) {
        probability += 20;
        features.push(`✓ Соотношение сторон: ${aspectRatio.toFixed(2)} (идеал: ${idealAspectRatio.toFixed(2)})`);
        } else {
        features.push(`✗ Нестандартное соотношение: ${aspectRatio.toFixed(2)}`);
        }
        
        // 3. Проверка формы (15%) - исправлено: от 4 до 6 углов
        const vertices = getApproxVertices(passportContour.contour, cv);
        if (vertices >= 4 && vertices <= 6) { // Исправлено: 4-6 углов
        probability += 15;
        features.push(`✓ Подходящая форма: ${vertices} углов`);
        } else {
        features.push(`✗ Неподходящая форма: ${vertices} углов`);
        }
        
        // 4. Проверка наличия внутренних контуров (25%)
        const photoContours = innerContours.filter(c => c.type === 'photo');
        const stampContours = innerContours.filter(c => c.type === 'stamp');
        const textContours = innerContours.filter(c => c.type === 'text_field');
        
        if (photoContours.length >= 1) {
        probability += 10;
        features.push(`✓ Найдено фото: ${photoContours.length}`);
        }
        if (stampContours.length >= 1) {
        probability += 8;
        features.push(`✓ Найдено печатей: ${stampContours.length}`);
        }
        if (textContours.length >= 2) {
        probability += 7;
        features.push(`✓ Найдено текстовых полей: ${textContours.length}`);
        }
        
        // 5. Проверка компактности контура (10%)
        const hull = new cv.Mat();
        cv.convexHull(passportContour.contour, hull);
        const hullArea = cv.contourArea(hull);
        const solidity = passportContour.area / hullArea;
        
        if (solidity > 0.85) { // Немного снижено для гибкости
        probability += 10;
        features.push(`✓ Компактность контура: ${(solidity * 100).toFixed(1)}%`);
        } else {
        features.push(`✗ Низкая компактность: ${(solidity * 100).toFixed(1)}%`);
        }
        hull.delete();
        
        return {
        probability: Math.min(100, probability),
        features,
        stats: {
            totalContours: innerContours.length,
            photoCount: photoContours.length,
            stampCount: stampContours.length,
            textCount: textContours.length,
            aspectRatio: aspectRatio,
            areaRatio: contourAreaRatio,
            solidity: solidity,
            vertices: vertices
        }
        };
    };

    const capturePhoto = useCallback(async () => {
        if (!webcamRef.current || !window.cv) return;
        setDetectionResult(null);
        const canvas = canvasRef.current;
        const cv = window.cv;
        const ctx = canvas.getContext('2d');

        const video = webcamRef.current.video;
        const startX = (video.videoWidth - 350) / 2;
        const startY = (video.videoHeight - 490) / 2;
        
        ctx.drawImage(video, startX, startY, 350, 490, 0, 0, 350, 490);
        
        const imgData = ctx.getImageData(0, 0, 350, 490);
        const src = cv.matFromImageData(imgData);

        try {
        // 1. Предобработка
        const processed = preprocessImage(src, cv);
        
        // 2. Детекция контуров
        const contours = findPassportContours(processed, cv);
        
        // 3. Поиск внешнего контура (паспорт)
        const passportContour = findLargestContour(contours.contours, cv);
        
        if (passportContour) {
            // 4. Поиск внутренних контуров (фото, печать)
            const innerContours = findInnerContours(passportContour.index, contours.hierarchy, contours.contours, cv);
            
            // 5. Расчет вероятности что это паспорт
            const probabilityResult = calculatePassportProbability(passportContour, innerContours, src, cv);
            
            // 6. Визуализация результатов
            const result = visualizeDetection(src, passportContour, innerContours, cv);
            
            // 7. Вывод в консоль
            console.log('🔍 АНАЛИЗ ДОКУМЕНТА:');
            console.log(`📊 Вероятность что это паспорт: ${probabilityResult.probability}%`);
            console.log('📋 Характеристики:');
            probabilityResult.features.forEach(feature => console.log(`   ${feature}`));
            console.log('📈 Статистика:');
            console.log(`   - Всего внутренних контуров: ${probabilityResult.stats.totalContours}`);
            console.log(`   - Фотографий: ${probabilityResult.stats.photoCount}`);
            console.log(`   - Печатей: ${probabilityResult.stats.stampCount}`);
            console.log(`   - Текстовых полей: ${probabilityResult.stats.textCount}`);
            console.log(`   - Углов контура: ${probabilityResult.stats.vertices}`);
            console.log(`   - Соотношение сторон: ${probabilityResult.stats.aspectRatio.toFixed(2)}`);
            console.log(`   - Занимаемая площадь: ${(probabilityResult.stats.areaRatio * 100).toFixed(1)}%`);
            
            // Устанавливаем результат для отображения в UI
            setDetectionResult(probabilityResult);
            
            showImage(cv, result);
            result.delete();
        } else {
            console.log('❌ Паспорт не обнаружен');
            console.log('📊 Вероятность что это паспорт: 0%');
            setDetectionResult({
            probability: 0,
            features: ['❌ Основной контур не найден'],
            stats: { 
                totalContours: 0, 
                photoCount: 0, 
                stampCount: 0, 
                textCount: 0,
                vertices: 0,
                aspectRatio: 0,
                areaRatio: 0
            }
            });
            showImage(cv, src);
        }

        processed.delete();
        contours.contours.delete();
        contours.hierarchy.delete();
        
        } catch (error) {
        console.error('Ошибка детекции:', error);
        showImage(cv, src);
        } finally {
        src.delete();
        }
    }, []);
    
    // Функции обработки (остаются без изменений)
    const preprocessImage = (src, cv) => {
        const gray = new cv.Mat();
        const blurred = new cv.Mat();
        const binary = new cv.Mat();
        
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
        cv.adaptiveThreshold(blurred, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
        
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
        cv.morphologyEx(binary, binary, cv.MORPH_CLOSE, kernel);
        cv.morphologyEx(binary, binary, cv.MORPH_OPEN, kernel);
        
        gray.delete();
        blurred.delete();
        kernel.delete();
        
        return binary;
    };
    
    const findPassportContours = (binary, cv) => {
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        
        cv.findContours(binary, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
        
        return { contours, hierarchy };
    };
    
    const findLargestContour = (contours, cv) => {
        let maxArea = 0;
        let maxIndex = -1;
        let maxContour = null;
        
        for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        
        if (area > 1000 && area > maxArea) {
            maxArea = area;
            maxIndex = i;
            maxContour = contour;
        }
        }
        
        return maxIndex !== -1 ? { 
        index: maxIndex, 
        contour: maxContour, 
        area: maxArea 
        } : null;
    };
    
    const findInnerContours = (parentIndex, hierarchy, contours, cv) => {
        const inner = [];
        const h = hierarchy.data32S;
        
        for (let i = 0; i < contours.size(); i++) {
        if (h[i * 4 + 3] === parentIndex) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            
            if (area > 50 && area < 2000) {
            const aspectRatio = getAspectRatio(contour, cv);
            const type = classifyInnerContour(contour, aspectRatio, cv);
            
            inner.push({
                index: i,
                contour: contour,
                area: area,
                aspectRatio: aspectRatio,
                type: type
            });
            }
        }
        }
        
        return inner;
    };
    
    const getAspectRatio = (contour, cv) => {
        const rect = cv.boundingRect(contour);
        return rect.width / rect.height;
    };
    
    const classifyInnerContour = (contour, aspectRatio, cv) => {
        const area = cv.contourArea(contour);
        const vertices = getApproxVertices(contour, cv);
        
        if (Math.abs(aspectRatio - 1.0) < 0.3 && area > 300 && area < 1200) {
        return 'photo';
        }
        if (Math.abs(aspectRatio - 1.0) < 0.2 && area < 300) {
        return 'stamp';
        }
        if (vertices === 4 && area > 100) {
        return 'text_field';
        }
        
        return 'unknown';
    };
    
    const getApproxVertices = (contour, cv) => {
        const epsilon = 0.02 * cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, epsilon, true);
        const vertices = approx.rows;
        approx.delete();
        return vertices;
    };
    
    const visualizeDetection = (src, passportContour, innerContours, cv) => {
        const result = new cv.Mat();
        src.copyTo(result);
        
        const outerContours = new cv.MatVector();
        outerContours.push_back(passportContour.contour);
        cv.drawContours(result, outerContours, 0, [0, 255, 0, 255], 3);
        
        innerContours.forEach(inner => {
        const innerContoursVec = new cv.MatVector();
        innerContoursVec.push_back(inner.contour);
        
        let color;
        switch(inner.type) {
            case 'photo':
            color = [255, 0, 0, 255];
            break;
            case 'stamp':
            color = [0, 0, 255, 255];
            break;
            case 'text_field':
            color = [255, 255, 0, 255];
            break;
            default:
            color = [128, 128, 128, 255];
        }
        
        cv.drawContours(result, innerContoursVec, 0, color, 2);
        innerContoursVec.delete();
        });
        
        outerContours.delete();
        return result;
    };
    return {
        capturePhoto,
        detectionResult,
        capturedImage
    }

}


// hooks/useDocumentDetector.js







export const useDocumentDetectV2 = (webcamRef, canvasRef) => {
    const [detectionResult, setDetectionResult] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
   
    const showImage = (cv, cvMatObj) => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cvMatObj.cols;
        tempCanvas.height = cvMatObj.rows;
        cv.imshow(tempCanvas, cvMatObj);
        const dataUrl = tempCanvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
    };

    const calculatePassportProbability = (passportContour, innerContours, src, cv) => {
        let probability = 0;
        const features = [];
        
        // 1. Проверка размера основного контура (30%)
        const imageArea = src.rows * src.cols;
        const contourAreaRatio = passportContour.area / imageArea;
        const areaPercent = contourAreaRatio * 100;
        
        // Исправлено: занимаемая площадь от 60% до 90%
        if (areaPercent >= 60 && areaPercent <= 90) {
            probability += 30;
            features.push(`✓ Размер документа: ${areaPercent.toFixed(1)}% от кадра`);
        } else {
            features.push(`✗ Неподходящий размер: ${areaPercent.toFixed(1)}% от кадра (требуется 60-90%)`);
        }
        
        // 2. Проверка соотношения сторон (20%)
        const rect = cv.boundingRect(passportContour.contour);
        const aspectRatio = rect.width / rect.height;
        const idealAspectRatio = 88 / 125; // Стандартное соотношение паспорта РФ
        const aspectRatioDiff = Math.abs(aspectRatio - idealAspectRatio);
        
        if (aspectRatioDiff < 0.2) {
            probability += 20;
            features.push(`✓ Соотношение сторон: ${aspectRatio.toFixed(2)} (идеал: ${idealAspectRatio.toFixed(2)})`);
        } else {
            features.push(`✗ Нестандартное соотношение: ${aspectRatio.toFixed(2)}`);
        }
        
        // 3. Проверка формы (15%) - исправлено: от 4 до 6 углов
        const vertices = getApproxVertices(passportContour.contour, cv);
        if (vertices >= 4 && vertices <= 6) { // Исправлено: 4-6 углов
            probability += 15;
            features.push(`✓ Подходящая форма: ${vertices} углов`);
        } else {
            features.push(`✗ Неподходящая форма: ${vertices} углов (требуется 4-6)`);
        }
        
        // 4. Проверка наличия внутренних контуров (25%)
        const photoContours = innerContours.filter(c => c.type === 'photo');
        const stampContours = innerContours.filter(c => c.type === 'stamp');
        const textContours = innerContours.filter(c => c.type === 'text_field');
        
        if (photoContours.length >= 1) {
            probability += 10;
            features.push(`✓ Найдено фото: ${photoContours.length}`);
        } else {
            features.push(`✗ Фото не найдено`);
        }
        
        if (stampContours.length >= 1) {
            probability += 8;
            features.push(`✓ Найдено печатей: ${stampContours.length}`);
        } else {
            features.push(`✗ Печати не найдены`);
        }
        
        if (textContours.length >= 2) {
            probability += 7;
            features.push(`✓ Найдено текстовых полей: ${textContours.length}`);
        } else {
            features.push(`✗ Мало текстовых полей: ${textContours.length} (требуется 2+)`);
        }
        
        // 5. Проверка компактности контура (10%)
        const hull = new cv.Mat();
        cv.convexHull(passportContour.contour, hull);
        const hullArea = cv.contourArea(hull);
        const solidity = passportContour.area / hullArea;
        
        if (solidity > 0.85) {
            probability += 10;
            features.push(`✓ Компактность контура: ${(solidity * 100).toFixed(1)}%`);
        } else {
            features.push(`✗ Низкая компактность: ${(solidity * 100).toFixed(1)}%`);
        }
        hull.delete();
        
        return {
            probability: Math.min(100, probability),
            features,
            stats: {
                totalContours: innerContours.length,
                photoCount: photoContours.length,
                stampCount: stampContours.length,
                textCount: textContours.length,
                aspectRatio: aspectRatio,
                areaRatio: contourAreaRatio,
                areaPercent: areaPercent, // Добавлено для удобства
                solidity: solidity,
                vertices: vertices
            }
        };
    };

    const capturePhoto = useCallback(async () => {
        if (!webcamRef.current || !window.cv) return;
        setDetectionResult(null);
        const canvas = canvasRef.current;
        const cv = window.cv;
        const ctx = canvas.getContext('2d');

        const video = webcamRef.current.video;
        const startX = (video.videoWidth - 350) / 2;
        const startY = (video.videoHeight - 490) / 2;
        
        ctx.drawImage(video, startX, startY, 350, 490, 0, 0, 350, 490);
        
        const imgData = ctx.getImageData(0, 0, 350, 490);
        const src = cv.matFromImageData(imgData);

        try {
            // 1. Предобработка
            const processed = preprocessImage(src, cv);
            
            // 2. Детекция контуров
            const contours = findPassportContours(processed, cv);
            
            // 3. Поиск внешнего контура (паспорт)
            const passportContour = findLargestContour(contours.contours, cv);
            
            if (passportContour) {
                // 4. Поиск внутренних контуров (фото, печать)
                const innerContours = findInnerContours(passportContour.index, contours.hierarchy, contours.contours, cv);
                
                // 5. Расчет вероятности что это паспорт
                const probabilityResult = calculatePassportProbability(passportContour, innerContours, src, cv);
                
                // 6. Визуализация результатов
                const result = visualizeDetection(src, passportContour, innerContours, cv);
                
                // 7. Вывод в консоль
                console.log('🔍 АНАЛИЗ ДОКУМЕНТА:');
                console.log(`📊 Вероятность что это паспорт: ${probabilityResult.probability}%`);
                console.log('📋 Характеристики:');
                probabilityResult.features.forEach(feature => console.log(`   ${feature}`));
                console.log('📈 Статистика:');
                console.log(`   - Всего внутренних контуров: ${probabilityResult.stats.totalContours}`);
                console.log(`   - Фотографий: ${probabilityResult.stats.photoCount}`);
                console.log(`   - Печатей: ${probabilityResult.stats.stampCount}`);
                console.log(`   - Текстовых полей: ${probabilityResult.stats.textCount}`);
                console.log(`   - Углов контура: ${probabilityResult.stats.vertices}`);
                console.log(`   - Соотношение сторон: ${probabilityResult.stats.aspectRatio.toFixed(2)}`);
                console.log(`   - Занимаемая площадь: ${probabilityResult.stats.areaPercent.toFixed(1)}%`);
                
                // Устанавливаем результат для отображения в UI
                setDetectionResult(probabilityResult);
                
                showImage(cv, result);
                result.delete();
            } else {
                console.log('❌ Паспорт не обнаружен');
                console.log('📊 Вероятность что это паспорт: 0%');
                setDetectionResult({
                    probability: 0,
                    features: ['❌ Основной контур не найден'],
                    stats: { 
                        totalContours: 0, 
                        photoCount: 0, 
                        stampCount: 0, 
                        textCount: 0,
                        vertices: 0,
                        aspectRatio: 0,
                        areaRatio: 0,
                        areaPercent: 0
                    }
                });
                showImage(cv, src);
            }

            processed.delete();
            contours.contours.delete();
            contours.hierarchy.delete();
            
        } catch (error) {
            console.error('Ошибка детекции:', error);
            showImage(cv, src);
        } finally {
            src.delete();
        }
    }, []);
    
    // Функции обработки (остаются без изменений)
    const preprocessImage = (src, cv) => {
        const gray = new cv.Mat();
        const blurred = new cv.Mat();
        const binary = new cv.Mat();
        
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
        cv.adaptiveThreshold(blurred, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
        
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
        cv.morphologyEx(binary, binary, cv.MORPH_CLOSE, kernel);
        cv.morphologyEx(binary, binary, cv.MORPH_OPEN, kernel);
        
        gray.delete();
        blurred.delete();
        kernel.delete();
        
        return binary;
    };
    
    const findPassportContours = (binary, cv) => {
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        
        cv.findContours(binary, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
        
        return { contours, hierarchy };
    };
    
    const findLargestContour = (contours, cv) => {
        let maxArea = 0;
        let maxIndex = -1;
        let maxContour = null;
        
        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            
            if (area > 1000 && area > maxArea) {
                maxArea = area;
                maxIndex = i;
                maxContour = contour;
            }
        }
        
        return maxIndex !== -1 ? { 
            index: maxIndex, 
            contour: maxContour, 
            area: maxArea 
        } : null;
    };
    
    const findInnerContours = (parentIndex, hierarchy, contours, cv) => {
        const inner = [];
        const h = hierarchy.data32S;
        
        for (let i = 0; i < contours.size(); i++) {
            if (h[i * 4 + 3] === parentIndex) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                if (area > 50 && area < 2000) {
                    const aspectRatio = getAspectRatio(contour, cv);
                    const type = classifyInnerContour(contour, aspectRatio, cv);
                    
                    inner.push({
                        index: i,
                        contour: contour,
                        area: area,
                        aspectRatio: aspectRatio,
                        type: type
                    });
                }
            }
        }
        
        return inner;
    };
    
    const getAspectRatio = (contour, cv) => {
        const rect = cv.boundingRect(contour);
        return rect.width / rect.height;
    };
    
    const classifyInnerContour = (contour, aspectRatio, cv) => {
        const area = cv.contourArea(contour);
        const vertices = getApproxVertices(contour, cv);
        
        if (Math.abs(aspectRatio - 1.0) < 0.3 && area > 300 && area < 1200) {
            return 'photo';
        }
        if (Math.abs(aspectRatio - 1.0) < 0.2 && area < 300) {
            return 'stamp';
        }
        if (vertices === 4 && area > 100) {
            return 'text_field';
        }
        
        return 'unknown';
    };
    
    const getApproxVertices = (contour, cv) => {
        const epsilon = 0.02 * cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, epsilon, true);
        const vertices = approx.rows;
        approx.delete();
        return vertices;
    };
    
    const visualizeDetection = (src, passportContour, innerContours, cv) => {
        const result = new cv.Mat();
        src.copyTo(result);
        
        const outerContours = new cv.MatVector();
        outerContours.push_back(passportContour.contour);
        cv.drawContours(result, outerContours, 0, [0, 255, 0, 255], 3);
        
        innerContours.forEach(inner => {
            const innerContoursVec = new cv.MatVector();
            innerContoursVec.push_back(inner.contour);
            
            let color;
            switch(inner.type) {
                case 'photo':
                    color = [255, 0, 0, 255];
                    break;
                case 'stamp':
                    color = [0, 0, 255, 255];
                    break;
                case 'text_field':
                    color = [255, 255, 0, 255];
                    break;
                default:
                    color = [128, 128, 128, 255];
            }
            
            cv.drawContours(result, innerContoursVec, 0, color, 2);
            innerContoursVec.delete();
        });
        
        outerContours.delete();
        return result;
    };

    return {
        capturePhoto,
        detectionResult,
        capturedImage
    };
};







export const useDocumentDetectV3 = (webcamRef, canvasRef) => {
    const [detectionResult, setDetectionResult] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
   
    const showImage = (cv, cvMatObj) => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cvMatObj.cols;
        tempCanvas.height = cvMatObj.rows;
        cv.imshow(tempCanvas, cvMatObj);
        const dataUrl = tempCanvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
    };

    // Функция анализа цвета паспорта
    const analyzePassportColor = (src, passportContour, cv) => {
        try {
            // Создаем маску для области паспорта
            const mask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
            const contours = new cv.MatVector();
            contours.push_back(passportContour.contour);
            cv.drawContours(mask, contours, 0, [255, 255, 255], -1);
            
            // Анализируем цвет только внутри контура паспорта
            const masked = new cv.Mat();
            src.copyTo(masked, mask);
            
            // Конвертируем в HSV для лучшего анализа цвета
            const hsv = new cv.Mat();
            cv.cvtColor(masked, hsv, cv.COLOR_RGBA2RGB);
            cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
            
            // Определяем диапазоны цветов для паспорта РФ
            const lowerRed1 = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 50, 50, 0]);
            const upperRed1 = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [10, 255, 255, 255]);
            const lowerRed2 = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [170, 50, 50, 0]);
            const upperRed2 = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [180, 255, 255, 255]);
            
            const mask1 = new cv.Mat();
            const mask2 = new cv.Mat();
            cv.inRange(hsv, lowerRed1, upperRed1, mask1);
            cv.inRange(hsv, lowerRed2, upperRed2, mask2);
            
            // Комбинируем маски
            const colorMask = new cv.Mat();
            cv.bitwise_or(mask1, mask2, colorMask);
            
            // Подсчитываем процент красных пикселей
            const totalPixels = cv.countNonZero(mask);
            const redPixels = cv.countNonZero(colorMask);
            const redPercentage = totalPixels > 0 ? (redPixels / totalPixels) * 100 : 0;
            
            // Анализируем общую яркость для проверки освещения
            const gray = new cv.Mat();
            cv.cvtColor(masked, gray, cv.COLOR_RGBA2GRAY);
            const meanBrightness = cv.mean(gray)[0];
            
            // Анализируем равномерность освещения
            const stdDev = new cv.Mat();
            cv.meanStdDev(gray, new cv.Mat(), stdDev);
            const brightnessStdDev = stdDev.data64F[0];
            
            // Очищаем память
            mask.delete();
            contours.delete();
            masked.delete();
            hsv.delete();
            lowerRed1.delete();
            upperRed1.delete();
            lowerRed2.delete();
            upperRed2.delete();
            mask1.delete();
            mask2.delete();
            colorMask.delete();
            gray.delete();
            stdDev.delete();
            
            return {
                redPercentage,
                meanBrightness,
                brightnessStdDev,
                isGoodLighting: meanBrightness > 50 && meanBrightness < 200,
                isUniformLighting: brightnessStdDev < 60,
                isPassportColor: redPercentage > 15
            };
            
        } catch (error) {
            console.error('Ошибка анализа цвета:', error);
            return {
                redPercentage: 0,
                meanBrightness: 0,
                brightnessStdDev: 0,
                isGoodLighting: false,
                isUniformLighting: false,
                isPassportColor: false
            };
        }
    };

    const calculatePassportProbability = (passportContour, innerContours, src, cv) => {
        let probability = 0;
        const features = [];
        
        // 1. Проверка размера основного контура (30%) - ИСПРАВЛЕНО: 70-100%
        const imageArea = src.rows * src.cols;
        const contourAreaRatio = passportContour.area / imageArea;
        const areaPercent = contourAreaRatio * 100;
        
        if (areaPercent >= 70 && areaPercent <= 100) {
            probability += 30;
            features.push(`✓ Размер документа: ${areaPercent.toFixed(1)}% от кадра`);
        } else {
            features.push(`✗ Неподходящий размер: ${areaPercent.toFixed(1)}% от кадра (требуется 70-100%)`);
        }
        
        // 2. Проверка соотношения сторон (20%)
        const rect = cv.boundingRect(passportContour.contour);
        const aspectRatio = rect.width / rect.height;
        const idealAspectRatio = 88 / 125;
        const aspectRatioDiff = Math.abs(aspectRatio - idealAspectRatio);
        
        if (aspectRatioDiff < 0.2) {
            probability += 20;
            features.push(`✓ Соотношение сторон: ${aspectRatio.toFixed(2)} (идеал: ${idealAspectRatio.toFixed(2)})`);
        } else {
            features.push(`✗ Нестандартное соотношение: ${aspectRatio.toFixed(2)}`);
        }
        
        // 3. Проверка формы (15%)
        const vertices = getApproxVertices(passportContour.contour, cv);
        if (vertices >= 4 && vertices <= 6) {
            probability += 15;
            features.push(`✓ Подходящая форма: ${vertices} углов`);
        } else {
            features.push(`✗ Неподходящая форма: ${vertices} углов (требуется 4-6)`);
        }
        
        // 4. Проверка наличия внутренних контуров (25%)
        const photoContours = innerContours.filter(c => c.type === 'photo');
        const stampContours = innerContours.filter(c => c.type === 'stamp');
        const textContours = innerContours.filter(c => c.type === 'text_field');
        
        if (photoContours.length >= 1) {
            probability += 10;
            features.push(`✓ Найдено фото: ${photoContours.length}`);
        } else {
            features.push(`✗ Фото не найдено`);
        }
        
        if (stampContours.length >= 1) {
            probability += 8;
            features.push(`✓ Найдено печатей: ${stampContours.length}`);
        } else {
            features.push(`✗ Печати не найдены`);
        }
        
        if (textContours.length >= 2) {
            probability += 7;
            features.push(`✓ Найдено текстовых полей: ${textContours.length}`);
        } else {
            features.push(`✗ Мало текстовых полей: ${textContours.length} (требуется 2+)`);
        }
        
        // 5. Проверка компактности контура (5%)
        const hull = new cv.Mat();
        cv.convexHull(passportContour.contour, hull);
        const hullArea = cv.contourArea(hull);
        const solidity = passportContour.area / hullArea;
        
        if (solidity > 0.85) {
            probability += 5;
            features.push(`✓ Компактность контура: ${(solidity * 100).toFixed(1)}%`);
        } else {
            features.push(`✗ Низкая компактность: ${(solidity * 100).toFixed(1)}%`);
        }
        hull.delete();
        
        // 6. Анализ цвета и освещения (5%) - ИСПРАВЛЕНО: уменьшен вес с 25% до 5%
        const colorAnalysis = analyzePassportColor(src, passportContour, cv);
        
        if (colorAnalysis.isPassportColor) {
            probability += 3;
            features.push(`✓ Цвет документа: ${colorAnalysis.redPercentage.toFixed(1)}% красных оттенков`);
        } else {
            features.push(`✗ Неподходящий цвет: ${colorAnalysis.redPercentage.toFixed(1)}% красных оттенков`);
        }
        
        if (colorAnalysis.isGoodLighting) {
            probability += 1;
            features.push(`✓ Освещение: нормальное (${colorAnalysis.meanBrightness.toFixed(0)} lux)`);
        } else {
            features.push(`✗ Плохое освещение: ${colorAnalysis.meanBrightness.toFixed(0)} lux`);
        }
        
        if (colorAnalysis.isUniformLighting) {
            probability += 1;
            features.push(`✓ Равномерность освещения: хорошая`);
        } else {
            features.push(`✗ Неравномерное освещение: тени/блики`);
        }
        
        return {
            probability: Math.min(100, probability),
            features,
            stats: {
                totalContours: innerContours.length,
                photoCount: photoContours.length,
                stampCount: stampContours.length,
                textCount: textContours.length,
                aspectRatio: aspectRatio,
                areaRatio: contourAreaRatio,
                areaPercent: areaPercent,
                solidity: solidity,
                vertices: vertices,
                colorAnalysis: colorAnalysis
            }
        };
    };

    const capturePhoto = useCallback(async () => {
        if (!webcamRef.current || !window.cv) return;
        setDetectionResult(null);
        const canvas = canvasRef.current;
        const cv = window.cv;
        const ctx = canvas.getContext('2d');

        const video = webcamRef.current.video;
        const startX = (video.videoWidth - 350) / 2;
        const startY = (video.videoHeight - 490) / 2;
        
        ctx.drawImage(video, startX, startY, 350, 490, 0, 0, 350, 490);
        
        const imgData = ctx.getImageData(0, 0, 350, 490);
        const src = cv.matFromImageData(imgData);

        try {
            // 1. Предобработка
            const processed = preprocessImage(src, cv);
            
            // 2. Детекция контуров
            const contours = findPassportContours(processed, cv);
            
            // 3. Поиск внешнего контура (паспорт)
            const passportContour = findLargestContour(contours.contours, cv);
            
            if (passportContour) {
                // 4. Поиск внутренних контуров (фото, печать)
                const innerContours = findInnerContours(passportContour.index, contours.hierarchy, contours.contours, cv);
                
                // 5. Расчет вероятности что это паспорт
                const probabilityResult = calculatePassportProbability(passportContour, innerContours, src, cv);
                
                // 6. Визуализация результатов
                const result = visualizeDetection(src, passportContour, innerContours, cv);
                
                // 7. Вывод в консоль
                // console.log('🔍 АНАЛИЗ ДОКУМЕНТА:');
                // console.log(`📊 Вероятность что это паспорт: ${probabilityResult.probability}%`);
                // console.log('📋 Характеристики:');
                // probabilityResult.features.forEach(feature => console.log(`   ${feature}`));
                // console.log('🎨 Анализ цвета и освещения:');
                // console.log(`   - Красные оттенки: ${probabilityResult.stats.colorAnalysis.redPercentage.toFixed(1)}%`);
                // console.log(`   - Яркость: ${probabilityResult.stats.colorAnalysis.meanBrightness.toFixed(0)} lux`);
                // console.log(`   - Равномерность: ${probabilityResult.stats.colorAnalysis.brightnessStdDev.toFixed(1)}`);
                // console.log(`   - Подходящий цвет: ${probabilityResult.stats.colorAnalysis.isPassportColor ? 'Да' : 'Нет'}`);
                // console.log(`   - Хорошее освещение: ${probabilityResult.stats.colorAnalysis.isGoodLighting ? 'Да' : 'Нет'}`);
                // console.log(`   - Равномерное освещение: ${probabilityResult.stats.colorAnalysis.isUniformLighting ? 'Да' : 'Нет'}`);
                
                // Устанавливаем результат для отображения в UI
                setDetectionResult(probabilityResult);
                
                showImage(cv, result);
                result.delete();
            } else {
                console.log('❌ Паспорт не обнаружен');
                console.log('📊 Вероятность что это паспорт: 0%');
                setDetectionResult({
                    probability: 0,
                    features: ['❌ Основной контур не найден'],
                    stats: { 
                        totalContours: 0, 
                        photoCount: 0, 
                        stampCount: 0, 
                        textCount: 0,
                        vertices: 0,
                        aspectRatio: 0,
                        areaRatio: 0,
                        areaPercent: 0,
                        colorAnalysis: {
                            redPercentage: 0,
                            meanBrightness: 0,
                            brightnessStdDev: 0,
                            isGoodLighting: false,
                            isUniformLighting: false,
                            isPassportColor: false
                        }
                    }
                });
                showImage(cv, src);
            }

            processed.delete();
            contours.contours.delete();
            contours.hierarchy.delete();
            
        } catch (error) {
            console.error('Ошибка детекции:', error);
            showImage(cv, src);
        } finally {
            src.delete();
        }
    }, []);
    
    // Остальные функции без изменений
    const preprocessImage = (src, cv) => {
        const gray = new cv.Mat();
        const blurred = new cv.Mat();
        const binary = new cv.Mat();
        
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
        cv.adaptiveThreshold(blurred, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
        
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
        cv.morphologyEx(binary, binary, cv.MORPH_CLOSE, kernel);
        cv.morphologyEx(binary, binary, cv.MORPH_OPEN, kernel);
        
        gray.delete();
        blurred.delete();
        kernel.delete();
        
        return binary;
    };
    
    const findPassportContours = (binary, cv) => {
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        
        cv.findContours(binary, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
        
        return { contours, hierarchy };
    };
    
    const findLargestContour = (contours, cv) => {
        let maxArea = 0;
        let maxIndex = -1;
        let maxContour = null;
        
        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            
            if (area > 1000 && area > maxArea) {
                maxArea = area;
                maxIndex = i;
                maxContour = contour;
            }
        }
        
        return maxIndex !== -1 ? { 
            index: maxIndex, 
            contour: maxContour, 
            area: maxArea 
        } : null;
    };
    
    const findInnerContours = (parentIndex, hierarchy, contours, cv) => {
        const inner = [];
        const h = hierarchy.data32S;
        
        for (let i = 0; i < contours.size(); i++) {
            if (h[i * 4 + 3] === parentIndex) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                if (area > 50 && area < 2000) {
                    const aspectRatio = getAspectRatio(contour, cv);
                    const type = classifyInnerContour(contour, aspectRatio, cv);
                    
                    inner.push({
                        index: i,
                        contour: contour,
                        area: area,
                        aspectRatio: aspectRatio,
                        type: type
                    });
                }
            }
        }
        
        return inner;
    };
    
    const getAspectRatio = (contour, cv) => {
        const rect = cv.boundingRect(contour);
        return rect.width / rect.height;
    };
    
    const classifyInnerContour = (contour, aspectRatio, cv) => {
        const area = cv.contourArea(contour);
        const vertices = getApproxVertices(contour, cv);
        
        if (Math.abs(aspectRatio - 1.0) < 0.3 && area > 300 && area < 1200) {
            return 'photo';
        }
        if (Math.abs(aspectRatio - 1.0) < 0.2 && area < 300) {
            return 'stamp';
        }
        if (vertices === 4 && area > 100) {
            return 'text_field';
        }
        
        return 'unknown';
    };
    
    const getApproxVertices = (contour, cv) => {
        const epsilon = 0.02 * cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, epsilon, true);
        const vertices = approx.rows;
        approx.delete();
        return vertices;
    };
    
    const visualizeDetection = (src, passportContour, innerContours, cv) => {
        const result = new cv.Mat();
        src.copyTo(result);
        
        const outerContours = new cv.MatVector();
        outerContours.push_back(passportContour.contour);
        cv.drawContours(result, outerContours, 0, [0, 255, 0, 255], 3);
        
        innerContours.forEach(inner => {
            const innerContoursVec = new cv.MatVector();
            innerContoursVec.push_back(inner.contour);
            
            let color;
            switch(inner.type) {
                case 'photo':
                    color = [255, 0, 0, 255];
                    break;
                case 'stamp':
                    color = [0, 0, 255, 255];
                    break;
                case 'text_field':
                    color = [255, 255, 0, 255];
                    break;
                default:
                    color = [128, 128, 128, 255];
            }
            
            cv.drawContours(result, innerContoursVec, 0, color, 2);
            innerContoursVec.delete();
        });
        
        outerContours.delete();
        return result;
    };

    return {
        capturePhoto,
        detectionResult,
        capturedImage
    };
};










// hooks/useAdvancedDocumentDetector.js


export const useAdvancedDocumentDetector = (webcamRef, canvasRef) => {
    const [detectionResult, setDetectionResult] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [tfModel, setTfModel] = useState(null);
    const [yoloModel, setYoloModel] = useState(null);
    const [isModelsLoaded, setIsModelsLoaded] = useState(false);

    // Загрузка моделей
    useEffect(() => {
        loadModels();
    }, []);

    const loadModels = async () => {
        try {
            // Загрузка TensorFlow модели для классификации документов
            const model = await tf.loadGraphModel('/models/document-classifier/model.json');
            setTfModel(model);
            
            // Загрузка YOLO модели для детекции объектов
            // const yolo = await tf.loadGraphModel('/models/yolo/model.json');
            // setYoloModel(yolo);
            
            console.log('🤖 Модели TensorFlow загружены');
            setIsModelsLoaded(true);
        } catch (error) {
            console.warn('Не удалось загрузить TensorFlow модели, используем классический подход:', error);
            setIsModelsLoaded(true);
        }
    };

    const showImage = (cv, cvMatObj) => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cvMatObj.cols;
        tempCanvas.height = cvMatObj.rows;
        cv.imshow(tempCanvas, cvMatObj);
        const dataUrl = tempCanvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        return dataUrl;
    };

    // Улучшенная предобработка с шумоподавлением
    const preprocessImage = (src, cv) => {
        // Уменьшение шума
        const denoised = new cv.Mat();
        cv.fastNlMeansDenoisingColored(src, denoised, 10, 10, 7, 21);
        
        // Увеличение резкости
        const sharpened = new cv.Mat();
        const kernel = new cv.Mat.fromArray(3, 3, cv.CV_32F, [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
        ]);
        cv.filter2D(denoised, sharpened, cv.CV_8U, kernel);
        
        // Конвертация в grayscale
        const gray = new cv.Mat();
        cv.cvtColor(sharpened, gray, cv.COLOR_RGBA2GRAY);
        
        // Адаптивная бинаризация
        const binary = new cv.Mat();
        cv.adaptiveThreshold(gray, binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
        
        // Морфологические операции для улучшения контуров
        const morphKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
        cv.morphologyEx(binary, binary, cv.MORPH_CLOSE, morphKernel);
        cv.morphologyEx(binary, binary, cv.MORPH_OPEN, morphKernel);
        
        // Очистка памяти
        denoised.delete();
        sharpened.delete();
        kernel.delete();
        gray.delete();
        morphKernel.delete();
        
        return binary;
    };

    // Детекция текста с помощью Tesseract
    const detectTextWithTesseract = async (imageDataUrl) => {
        try {
            const { data: { text, confidence } } = await Tesseract.recognize(imageDataUrl, 'rus+eng', {
                logger: m => console.log('Tesseract:', m)
            });
            
            console.log('📝 Tesseract текст:', text.substring(0, 100) + '...');
            console.log('🎯 Tesseract уверенность:', confidence);
            
            // Поиск ключевых слов паспорта
            const passportKeywords = [
                'паспорт', 'passport', 'россия', 'russia', 'фмс', 'мвд',
                'личность', 'identity', 'фамилия', 'surname', 'имя', 'name'
            ];
            
            const foundKeywords = passportKeywords.filter(keyword => 
                text.toLowerCase().includes(keyword.toLowerCase())
            );
            
            return {
                text: text.trim(),
                confidence,
                foundKeywords,
                keywordsCount: foundKeywords.length
            };
        } catch (error) {
            console.error('Ошибка Tesseract:', error);
            return { text: '', confidence: 0, foundKeywords: [], keywordsCount: 0 };
        }
    };

    // Классификация документа с помощью TensorFlow
    const classifyWithTensorFlow = async (imageDataUrl) => {
        if (!tfModel) return null;
        
        try {
            const img = new Image();
            img.src = imageDataUrl;
            await img.decode();
            
            const tensor = tf.browser.fromPixels(img)
                .resizeNearestNeighbor([224, 224])
                .toFloat()
                .expandDims();
            
            const prediction = tfModel.predict(tensor);
            const probabilities = await prediction.data();
            
            tensor.dispose();
            prediction.dispose();
            
            // Предполагаем, что модель возвращает [вероятность_не_паспорта, вероятность_паспорта]
            const passportProbability = probabilities[1] * 100;
            
            console.log('🧠 TensorFlow вероятность паспорта:', passportProbability.toFixed(1) + '%');
            
            return {
                isPassport: passportProbability > 50,
                probability: passportProbability
            };
        } catch (error) {
            console.error('Ошибка TensorFlow:', error);
            return null;
        }
    };

    // Улучшенная детекция контуров с фильтрацией по форме
    const findPassportContours = (binary, cv) => {
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        
        cv.findContours(binary, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE);
        
        return { contours, hierarchy };
    };

    const findLargestContour = (contours, cv) => {
        let maxArea = 0;
        let maxIndex = -1;
        let maxContour = null;
        
        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            
            // Фильтрация по минимальной площади
            if (area > 5000 && area > maxArea) {
                // Проверка формы (должен быть четырехугольник)
                const epsilon = 0.02 * cv.arcLength(contour, true);
                const approx = new cv.Mat();
                cv.approxPolyDP(contour, approx, epsilon, true);
                
                if (approx.rows >= 4 && approx.rows <= 6) {
                    maxArea = area;
                    maxIndex = i;
                    maxContour = contour;
                }
                
                approx.delete();
            }
        }
        
        return maxIndex !== -1 ? { 
            index: maxIndex, 
            contour: maxContour, 
            area: maxArea 
        } : null;
    };

    // Анализ HOG (Histogram of Oriented Gradients) признаков
    const analyzeHOGFeatures = (src, contour, cv) => {
        try {
            // Создаем маску для ROI
            const mask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
            const contours = new cv.MatVector();
            contours.push_back(contour);
            cv.drawContours(mask, contours, 0, [255, 255, 255], -1);
            
            // Вычисляем градиенты
            const gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            
            const gradX = new cv.Mat();
            const gradY = new cv.Mat();
            cv.Sobel(gray, gradX, cv.CV_32F, 1, 0);
            cv.Sobel(gray, gradY, cv.CV_32F, 0, 1);
            
            // Вычисляем магнитуду и угол градиента
            const magnitude = new cv.Mat();
            const angle = new cv.Mat();
            cv.cartToPolar(gradX, gradY, magnitude, angle, true);
            
            // Анализируем распределение градиентов (упрощенный HOG)
            const hist = new cv.Mat();
            const ranges = [0, 180];
            cv.calcHist(angle, [0], mask, hist, [9], ranges);
            
            // Нормализуем гистограмму
            cv.normalize(hist, hist, 0, 1, cv.NORM_MINMAX);
            
            // Анализируем равномерность распределения (документы имеют структурированные градиенты)
            let uniformity = 0;
            for (let i = 0; i < hist.rows; i++) {
                uniformity += Math.pow(hist.floatAt(i) - (1/9), 2);
            }
            uniformity = 1 - Math.sqrt(uniformity / 9);
            
            // Очистка памяти
            mask.delete();
            contours.delete();
            gray.delete();
            gradX.delete();
            gradY.delete();
            magnitude.delete();
            angle.delete();
            hist.delete();
            
            return {
                uniformity,
                hasStructure: uniformity > 0.3 // Документы имеют более структурированные градиенты
            };
        } catch (error) {
            console.error('Ошибка HOG анализа:', error);
            return { uniformity: 0, hasStructure: false };
        }
    };

    const calculatePassportProbability = async (passportContour, innerContours, src, cv, imageDataUrl) => {
        let probability = 0;
        const features = [];
        
        // 1. Геометрический анализ (40%)
        const imageArea = src.rows * src.cols;
        const contourAreaRatio = passportContour.area / imageArea;
        const areaPercent = contourAreaRatio * 100;
        
        if (areaPercent >= 70 && areaPercent <= 100) {
            probability += 20;
            features.push(`✓ Размер документа: ${areaPercent.toFixed(1)}% от кадра`);
        } else {
            features.push(`✗ Неподходящий размер: ${areaPercent.toFixed(1)}% от кадра`);
        }
        
        const rect = cv.boundingRect(passportContour.contour);
        const aspectRatio = rect.width / rect.height;
        const idealAspectRatio = 88 / 125;
        const aspectRatioDiff = Math.abs(aspectRatio - idealAspectRatio);
        
        if (aspectRatioDiff < 0.2) {
            probability += 10;
            features.push(`✓ Соотношение сторон: ${aspectRatio.toFixed(2)}`);
        } else {
            features.push(`✗ Нестандартное соотношение: ${aspectRatio.toFixed(2)}`);
        }
        
        const vertices = getApproxVertices(passportContour.contour, cv);
        if (vertices >= 4 && vertices <= 6) {
            probability += 10;
            features.push(`✓ Подходящая форма: ${vertices} углов`);
        } else {
            features.push(`✗ Неподходящая форма: ${vertices} углов`);
        }
        
        // 2. Анализ внутренней структуры (25%)
        const photoContours = innerContours.filter(c => c.type === 'photo');
        const stampContours = innerContours.filter(c => c.type === 'stamp');
        const textContours = innerContours.filter(c => c.type === 'text_field');
        
        if (photoContours.length >= 1) {
            probability += 8;
            features.push(`✓ Найдено фото: ${photoContours.length}`);
        }
        if (stampContours.length >= 1) {
            probability += 5;
            features.push(`✓ Найдено печатей: ${stampContours.length}`);
        }
        if (textContours.length >= 2) {
            probability += 7;
            features.push(`✓ Найдено текстовых полей: ${textContours.length}`);
        }
        
        // HOG анализ структуры (5%)
        const hogAnalysis = analyzeHOGFeatures(src, passportContour.contour, cv);
        if (hogAnalysis.hasStructure) {
            probability += 5;
            features.push(`✓ Структурированные градиенты: ${(hogAnalysis.uniformity * 100).toFixed(1)}%`);
        }
        
        // 3. Анализ текста с Tesseract (20%)
        const textAnalysis = await detectTextWithTesseract(imageDataUrl);
        if (textAnalysis.keywordsCount >= 2) {
            probability += 15;
            features.push(`✓ Ключевые слова: ${textAnalysis.foundKeywords.join(', ')}`);
        }
        if (textAnalysis.confidence > 50) {
            probability += 5;
            features.push(`✓ Качество текста: ${textAnalysis.confidence.toFixed(1)}%`);
        }
        
        // 4. Классификация с TensorFlow (15%)
        const tfAnalysis = await classifyWithTensorFlow(imageDataUrl);
        if (tfAnalysis && tfAnalysis.isPassport) {
            probability += 15;
            features.push(`✓ AI классификация: ${tfAnalysis.probability.toFixed(1)}%`);
        } else if (tfAnalysis) {
            features.push(`✗ AI классификация: ${tfAnalysis.probability.toFixed(1)}%`);
        }
        
        return {
            probability: Math.min(100, probability),
            features,
            stats: {
                totalContours: innerContours.length,
                photoCount: photoContours.length,
                stampCount: stampContours.length,
                textCount: textContours.length,
                aspectRatio: aspectRatio,
                areaPercent: areaPercent,
                vertices: vertices,
                textAnalysis,
                tfAnalysis,
                hogAnalysis
            }
        };
    };

    const capturePhoto = useCallback(async () => {
        if (!webcamRef.current || !window.cv) return;
        setDetectionResult(null);
        const canvas = canvasRef.current;
        const cv = window.cv;
        const ctx = canvas.getContext('2d');

        const video = webcamRef.current.video;
        const startX = (video.videoWidth - 350) / 2;
        const startY = (video.videoHeight - 490) / 2;
        
        ctx.drawImage(video, startX, startY, 350, 490, 0, 0, 350, 490);
        
        const imgData = ctx.getImageData(0, 0, 350, 490);
        const src = cv.matFromImageData(imgData);

        try {
            console.log('🚀 Запуск расширенной детекции документа...');
            
            // 1. Предобработка с улучшенным шумоподавлением
            const processed = preprocessImage(src, cv);
            
            // 2. Детекция контуров
            const contours = findPassportContours(processed, cv);
            
            // 3. Поиск основного контура
            const passportContour = findLargestContour(contours.contours, cv);
            
            if (passportContour) {
                // 4. Поиск внутренних контуров
                const innerContours = findInnerContours(passportContour.index, contours.hierarchy, contours.contours, cv);
                
                // 5. Визуализация и получение изображения
                const result = visualizeDetection(src, passportContour, innerContours, cv);
                const imageDataUrl = showImage(cv, result);
                
                // 6. Комплексный анализ
                const probabilityResult = await calculatePassportProbability(
                    passportContour, innerContours, src, cv, imageDataUrl
                );
                
                // 7. Вывод результатов
                console.log('🔍 РАСШИРЕННЫЙ АНАЛИЗ ДОКУМЕНТА:');
                console.log(`📊 Итоговая вероятность: ${probabilityResult.probability}%`);
                console.log('📋 Все характеристики:');
                probabilityResult.features.forEach(feature => console.log(`   ${feature}`));
                
                setDetectionResult(probabilityResult);
                result.delete();
            } else {
                console.log('❌ Основной контур не найден');
                showImage(cv, src);
                setDetectionResult({
                    probability: 0,
                    features: ['❌ Основной контур не найден'],
                    stats: {}
                });
            }

            processed.delete();
            contours.contours.delete();
            contours.hierarchy.delete();
            
        } catch (error) {
            console.error('Ошибка детекции:', error);
            showImage(cv, src);
        } finally {
            src.delete();
        }
    }, [tfModel, yoloModel]);

    // Вспомогательные функции (остаются аналогичными предыдущей версии)
    const findInnerContours = (parentIndex, hierarchy, contours, cv) => {
        const inner = [];
        const h = hierarchy.data32S;
        
        for (let i = 0; i < contours.size(); i++) {
            if (h[i * 4 + 3] === parentIndex) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                if (area > 50 && area < 2000) {
                    const aspectRatio = getAspectRatio(contour, cv);
                    const type = classifyInnerContour(contour, aspectRatio, cv);
                    
                    inner.push({
                        index: i,
                        contour: contour,
                        area: area,
                        aspectRatio: aspectRatio,
                        type: type
                    });
                }
            }
        }
        
        return inner;
    };
    
    const getAspectRatio = (contour, cv) => {
        const rect = cv.boundingRect(contour);
        return rect.width / rect.height;
    };
    
    const classifyInnerContour = (contour, aspectRatio, cv) => {
        const area = cv.contourArea(contour);
        const vertices = getApproxVertices(contour, cv);
        
        if (Math.abs(aspectRatio - 1.0) < 0.3 && area > 300 && area < 1200) {
            return 'photo';
        }
        if (Math.abs(aspectRatio - 1.0) < 0.2 && area < 300) {
            return 'stamp';
        }
        if (vertices === 4 && area > 100) {
            return 'text_field';
        }
        
        return 'unknown';
    };
    
    const getApproxVertices = (contour, cv) => {
        const epsilon = 0.02 * cv.arcLength(contour, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(contour, approx, epsilon, true);
        const vertices = approx.rows;
        approx.delete();
        return vertices;
    };
    
    const visualizeDetection = (src, passportContour, innerContours, cv) => {
        const result = new cv.Mat();
        src.copyTo(result);
        
        const outerContours = new cv.MatVector();
        outerContours.push_back(passportContour.contour);
        cv.drawContours(result, outerContours, 0, [0, 255, 0, 255], 3);
        
        innerContours.forEach(inner => {
            const innerContoursVec = new cv.MatVector();
            innerContoursVec.push_back(inner.contour);
            
            let color;
            switch(inner.type) {
                case 'photo':
                    color = [255, 0, 0, 255];
                    break;
                case 'stamp':
                    color = [0, 0, 255, 255];
                    break;
                case 'text_field':
                    color = [255, 255, 0, 255];
                    break;
                default:
                    color = [128, 128, 128, 255];
            }
            
            cv.drawContours(result, innerContoursVec, 0, color, 2);
            innerContoursVec.delete();
        });
        
        outerContours.delete();
        return result;
    };

    return {
        capturePhoto,
        detectionResult,
        capturedImage,
        isModelsLoaded
    };
};