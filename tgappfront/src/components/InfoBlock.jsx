// components/InfoBlock.js
import React, { useState, useCallback, useRef, useEffect } from 'react';

const InfoBlock = ({ index, infoBlockEditId, setInfoBlockEditId, title, data }) => {
  const touchTimer = useRef(null);
  const touchStartTime = useRef(0);
  const blockRef = useRef(null);

  // Проверяем, является ли этот блок активным для редактирования
  const isThisBlockInEditMode = infoBlockEditId === index;

  useEffect(() => {
    const navBar = document.querySelector('.navigation-bar');
    
    if (navBar) {
      if (infoBlockEditId === null) {
        navBar.classList.remove('hidden');
      } else if (infoBlockEditId === index) {
        navBar.classList.add('hidden');
      }
    }
    return () => {
      if (isThisBlockInEditMode && navBar) {
        navBar.classList.remove('hidden');
      }
    };
  }, [infoBlockEditId, index, isThisBlockInEditMode]);

  
  const handleTouchStart = (e) => {
    e.preventDefault();
    touchStartTime.current = Date.now();
    
    touchTimer.current = setTimeout(() => {
      // Если этот блок уже в режиме редактирования, выключаем режим
      const navBar = document.querySelector('.navigation-bar');
      if (isThisBlockInEditMode) {
        setInfoBlockEditId(null);
      } else {
        setInfoBlockEditId(index);
      }
    }, 500);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
      touchTimer.current = null;
    }
  };

  // Обработка клика вне блока для выхода из режима редактирования
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isThisBlockInEditMode && 
          blockRef.current && 
          !blockRef.current.contains(e.target)) {
        setInfoBlockEditId(null);
      }
    };

    if (isThisBlockInEditMode) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isThisBlockInEditMode, setInfoBlockEditId]);

  return (
    <div 
      ref={blockRef}
      className={`info-block-wrapper ${isThisBlockInEditMode ? 'edit-mode' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => e.stopPropagation()} // Предотвращаем всплытие клика
    >
      <h4>{title}</h4>
      <div className="info-block">
        {data.map((item, itemIndex) => (
          <div key={itemIndex} className="info-row">
            <span className="info-label">{item.label}:</span>
            <span className={`info-content ${item.className || ''}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoBlock;