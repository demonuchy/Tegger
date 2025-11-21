import React from 'react';
import './SubmitStatus.css';

const Error = () => {
  return (
        <div className="error-wrapper">
              <img src="emoji.png"/>  
              <p>Упс..</p> 
              <p>Произошла ошибка</p> 
        </div> 
  );
};

export default Error;