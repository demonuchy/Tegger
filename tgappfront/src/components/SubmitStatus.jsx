import React from 'react';
import './SubmitStatus.css';

const SubmitStatus = ({ status, message }) => {
  return (
    <div className="loading-screen">
      <div className="loading">
        <div className={`status-indicator ${status}`}>
          {status === 'loading' && (
            <div className="big-gray-spinner"></div>
          )}
          {status === 'success' && (
            <div className="success-checkmark">✓</div>
          )}
          {status === 'error' && (
            <div className="error-cross">✕</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitStatus;