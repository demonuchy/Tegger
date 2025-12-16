import React from 'react';
import './Error.css'

const Error = () => {
  return (
        <div className="error-wrapper">
            <div className='error-main'>
                  <div className='item' id={1}></div>
                  <div className='item' id={2}></div>
            </div>
            <div className='shadow'></div>
        </div> 
  );
};

export default Error;