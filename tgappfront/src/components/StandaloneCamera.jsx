// components/DocumentProcessor.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';


const DocumentProcessor = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null)


  const showImage = (cv, cvMatObj) => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 350;  // 350
    tempCanvas.height = 490; // 490

    cv.imshow(tempCanvas, cvMatObj);
    const DataUrl = tempCanvas.toDataURL('image/jpeg');
    setCapturedImage(DataUrl);
  
  }


  function findTopLeftCorner(cleaned) {
    const searchArea = {
        startY: Math.floor(cleaned.rows * 0.02),
        endY: Math.floor(cleaned.rows * 0.3),
        startX: Math.floor(cleaned.cols * 0.02),
        endX: Math.floor(cleaned.cols * 0.3)
    };

    for (let y = searchArea.startY; y <= searchArea.endY; y++) {
        for (let x = searchArea.startX; x <= searchArea.endX; x++) {
            let pixel = cleaned.ucharPtr(y, x);
            if (pixel[0] !== 0) continue; // пропускаем белые пиксели

            // Проверяем окрестность 5x5
            let isCorner = true;
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    let nx = x + dx;
                    let ny = y + dy;
                    
                    // Проверяем границы
                    if (nx < 0 || nx >= cleaned.cols || ny < 0 || ny >= cleaned.rows) {
                        continue;
                    }
                    
                    let neighborPixel = cleaned.ucharPtr(ny, nx);
                    
                    // Для левого верхнего угла ожидаем:
                    // - Слева и сверху в основном белые пиксели
                    // - Справа и снизу в основном черные пиксели
                    if ((dx < 0 || dy < 0) && neighborPixel[0] !== 255) {
                        isCorner = false;
                        break;
                    }
                    if ((dx > 0 || dy > 0) && neighborPixel[0] !== 0) {
                        isCorner = false;
                        break;
                    }
                }
                if (!isCorner) break;
            }
            
            if (isCorner) {
                return { x: x, y: y };
            }
        }
    }
    return null;
}



  const capturePhoto = useCallback(() => {
    if (webcamRef.current && window.cv) {
        const canvas = canvasRef.current;
        const cv = window.cv;
        const ctx = canvas.getContext('2d');

        const video = webcamRef.current.video;
        const startX = (video.videoWidth - 350) / 2;
        const startY = (video.videoHeight - 490) / 2;
        
        ctx.drawImage(video, startX, startY, 350, 490, 0, 0, 350, 490);
        
        const imgData = ctx.getImageData(0, 0, 350, 490);
        const src = cv.matFromImageData(imgData);
        
        const originalImage = new cv.Mat();
        src.copyTo(originalImage);

        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGB2GRAY);

        const binary = new cv.Mat();
        cv.adaptiveThreshold(
            gray,
            binary,
            255,
            cv.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv.THRESH_BINARY_INV,
            13,
            2
        );


        let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
        let cleaned = new cv.Mat();
        cv.morphologyEx(binary, cleaned, cv.MORPH_CLOSE, kernel);
      

        console.log("Вот он", pixsel)
        cv.circle(cleaned, new cv.Point(pixsel.x, pixsel.y), 2, new cv.Scalar(255), -1);
        showImage(cv, cleaned);

        
        /*
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();


        
        cv.findContours(
            binary, 
            contours, 
            hierarchy, 
            cv.RETR_TREE,     
            cv.CHAIN_APPROX_TC89_L1  // 1 CHAIN_APPROX_NONE 2 CHAIN_APPROX_TC89_L1 3 CHAIN_APPROX_TC89_KCOS
        );

        const resultImage = new cv.Mat();
        originalImage.copyTo(resultImage);

        const contoursExc = new cv.MatVector();
        const pasportContour = new cv.MatVector();

        let blackSameSize = new cv.Mat(src.rows, src.cols, cv.CV_8UC3, new cv.Scalar(0, 0, 0, 0));

        for (let i = 0; i < contours.size(); i++) {
          const contour = contours.get(i);
          const area = cv.contourArea(contour);
          if(area < 1500) continue;
          console.log(`контур ${i} площадь ${area}`)
          let approx = new cv.Mat();
          let epsilon = 0.0001 * cv.arcLength(contour, true);
          cv.approxPolyDP(contour, approx, epsilon, true); 
          contoursExc.push_back(approx)
          for (let i = 0; i < approx.rows; i++) {
            let points = approx.data32S;
            let x = points[i * 2];     // x координата
            let y = points[i * 2 + 1]; // y координата  
            let pixsel = blackSameSize.ucharPtr(y, x);
            pixsel[0] = 255;
            pixsel[1] = 0;
            pixsel[2] = 0;
            pixsel[3] = 255
          }       
        }  */
       

       

        src.delete();
        originalImage.delete();
        gray.delete();
        binary.delete();
        // blackSameSize.delete()
        // dilated.delete();
        // contours.delete();
        // hierarchy.delete();
        // resultImage.delete();
    }
}, []);

  // Функция для повторной съемки
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  // Функция для скачивания фото
  const downloadPhoto = useCallback(() => {
    if (capturedImage) {
      const link = document.createElement('a');
      link.href = capturedImage;
      link.download = `photo-${Date.now()}.jpg`;
      link.click();
    }
  }, [capturedImage]);

  useEffect(()=>{
    const canvas = document.createElement('canvas');
    canvas.width = 350;
    canvas.height = 490;
    canvasRef.current = canvas;
  },[])

  return (
    <div className="document-processor">
      {!capturedImage ? (
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
              onClick={capturePhoto}
            >
              📸 Сделать фото
            </button>
          </div>
        </div>
      ) : (
        <div className="photo-preview">
          <img 
            src={capturedImage} 
            alt="Сфотографированное изображение" 
            className="preview-image"
          />
          <div className="preview-controls">
            <button 
              className="control-button download-button"
              onClick={downloadPhoto}
            >
              💾 Скачать фото
            </button>
            <button 
              className="control-button retake-button"
              onClick={retakePhoto}
            >
              🔄 Снять заново
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentProcessor;