import cv2 
import numpy as np
import pytesseract



pytesseract.pytesseract.tesseract_cmd = r'D:\Program Files\Tesseract-OCR\tesseract.exe'



def process_passport_negative(image_path):

    cv2.namedWindow('Pev')
    cv2.resizeWindow('Pev', 600, 600)
    image = cv2.imread(image_path)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    inverted = cv2.bitwise_not(gray)
    white_bg = np.ones_like(gray) * 255
    

    height, width, channels = inverted.shape
    print(channels)

    for y in range(height):
        for x in range(width):
            # Чтение
            b = inverted.item(y, x, 0)
            g = inverted.item(y, x, 1)
            r = inverted.item(y, x, 2)


    
    cv2.imshow('Pev', inverted)
    cv2.waitKey(0)
   
# Использование
processed = process_passport_negative('passport.jpg')
text = pytesseract.image_to_string(processed, lang='rus')
print(text)