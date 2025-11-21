// components/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ 
  type = 'inline',
  fullScreen = false 
}) => {

  if (fullScreen) {
    return (
      <div className="page-loader">
        <div className="loader-content">
          <div className="loader-poin" ></div>
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