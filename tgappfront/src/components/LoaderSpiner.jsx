// components/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ 
  size = 'small', 
  text = 'Загрузка...', 
  type = 'inline',
  fullScreen = false 
}) => {
  const getTextSize = () => {
    switch(size) {
      case 'small': return '0.9rem';
      case 'large': return '1.2rem';
      default: return '1rem';
    }
  };

  if (fullScreen) {
    return (
      <div className="page-loader">
        <div className="loader-content">
          <div className="big-gray-spinner" ></div>
          <p 
            className="loader-text" 
            style={{ fontSize: getTextSize() }}
          >
            {text}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`loading-container ${type}`}>
      <div className="loader-content">
        <div className="loader-poin"></div>
      </div>
    </div>
  );
};

export default LoadingSpinner;