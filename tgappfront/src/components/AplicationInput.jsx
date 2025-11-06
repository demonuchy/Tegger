import React from 'react';

const AplicationInput = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  onFocus,
  onBlur,
  placeholder, 
  required = false,
  rows,
  error,
  isActive,
  maxLength
}) => {
  
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const handleFocus = (e) => {
    if (onFocus) {
      onFocus();
    }
  };

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur();
    }
  };

  if (type === 'textarea') {
    return (
      <div className={`input-group ${isActive ? 'input-group-active' : ''} ${error ? 'input-group-error' : ''}`}>
        <label htmlFor={name} className="input-label">
          {label}
          {required && <span className="required-star">*</span>}
        </label>
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={rows}
          className="input-field input-textarea"
          required={required}
        />
        {error && <div className="input-error">{error}</div>}
      </div>
    );
  }

  return (
    <div className={`input-group ${isActive ? 'input-group-active' : ''} ${error ? 'input-group-error' : ''}`}>
      <label htmlFor={name} className="input-label">
        {label}
        {required && <span className="required-star">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        className="input-field"
        maxLength={maxLength}
      />
      {error && <div className="input-error">{error}</div>}
    </div>
  );
};

export default AplicationInput;