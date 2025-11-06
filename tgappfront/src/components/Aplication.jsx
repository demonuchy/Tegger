import React, { useState, useCallback } from 'react';
import AplicationInput from './AplicationInput';
import { useTelegram } from '../hooks/useTelegramAPI';

const Application = () => {
  const {
    user,
    isLoading,
    isDevelopmentMode,
    showAlert,
    sendData,
    setupMainButton
  } = useTelegram();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: ''
  });
  const [activeField, setActiveField] = useState(null);
  const [errors, setErrors] = useState({});

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{0,11}$/;
    return phoneRegex.test(phone);
  };
  
  const formatPhone = (phone, previousPhone = '') => {
    const cleaned = phone.replace(/\D/g, '');
    const previousCleaned = previousPhone.replace(/\D/g, '');
    
    const isDeleting = cleaned.length < previousCleaned.length;
    
    if (isDeleting && cleaned.length <= 1) {
      return cleaned;
    }
    
    if (cleaned.length === 0) return '';
    
    if (cleaned.length === 1) {
      return cleaned === '7' ? '+7 (' : `+7 (${cleaned}`;
    }
    if (cleaned.length <= 4) {
      return `+7 (${cleaned.slice(1)}`;
    }
    if (cleaned.length <= 7) {
      return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4)}`;
    }
    if (cleaned.length <= 9) {
      return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let newValue = value;
    let error = '';
  
    if (name === 'phone') {
      const previousValue = formData.phone;
      const cleanedValue = value.replace(/\D/g, '');
      
      if (!validatePhone(cleanedValue)) {
        error = 'Номер телефона должен содержать только цифры (максимум 11)';
      } else if (cleanedValue.length > 11) {
        error = 'Номер телефона не может быть длиннее 11 цифр';
      }
      
      newValue = formatPhone(value, previousValue);
    }
  
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleInputFocus = (fieldName) => {
    setActiveField(fieldName);
  };

  const handleInputBlur = () => {
    setActiveField(null);
  };

  const handleSubmit = useCallback(() => {
    const newErrors = {};
    
    // Валидация ФИО
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Поле ФИО обязательно для заполнения';
    }
    
    // Валидация телефона
    if (!formData.phone.trim()) {
      newErrors.phone = 'Поле телефона обязательно для заполнения';
    } else {
      const cleanedPhone = formData.phone.replace(/\D/g, '');
      if (cleanedPhone.length !== 11) {
        newErrors.phone = 'Номер телефона должен содержать 11 цифр';
      }
    }
    
    // Валидация email (если заполнен)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Введите корректный email адрес';
    }
    
    setErrors(newErrors);
    const hasErrors = Object.keys(newErrors).length > 0;
    
    if (hasErrors) {
      showAlert('Пожалуйста, заполните обязательные поля корректно');
      return;
    }
    
    const submitData = {
      ...formData,
      user: user || 'unknown'
    };
    
    const success = sendData(JSON.stringify(submitData));
    if (success) {
      showAlert('Данные успешно отправлены!');
    } else {
      console.log('Отправка данных (режим разработки):', submitData);
      alert('Данные успешно отправлены! (режим разработки)');
    }
  }, [formData, user, showAlert, sendData]);

  // Настраиваем главную кнопку Telegram
  React.useEffect(() => {
    if (!isDevelopmentMode) {
      setupMainButton('Отправить данные', handleSubmit);
    }
  }, [isDevelopmentMode, setupMainButton, handleSubmit]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading">
          <div className="orange-spinner"></div>
          <p>Загрузка приложения...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app main-screen">
      <header className="header">
        <h1 className="main-title">
          <span className="title-bereg">Берег</span>
          <span className="title-dona">Дона</span>
        </h1>
        <p>Заполните форму для вступления</p>
        {isDevelopmentMode && (
          <div className="dev-mode-banner">
            🔧 Режим разработки (Telegram не обнаружен)
          </div>
        )}
      </header>

      <div className="user-info-card">
        <h3>
          <div className="user-avatar">
            {user && user.photo_url ? (
              <img src={user.photo_url} alt="Avatar" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                {user && user.first_name ? user.first_name[0].toUpperCase() : 'U'}
              </div>
            )}
          </div>
          Ваши данные
        </h3>
        {user ? (
          <>
            <p><strong>Telegram ID:</strong> {user.id}</p>
            <p><strong>Имя:</strong> {user.first_name}</p>
            {user.last_name && <p><strong>Фамилия:</strong> {user.last_name}</p>}
            {user.username && <p><strong>Username:</strong> @{user.username}</p>}
          </>
        ) : (
          <p style={{display: "flex", justifyContent: "center"}}>Dev</p>
        )}
      </div>

      <div className="form-container">
        <form className="registration-form">
          <AplicationInput
            label="ФИО"
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            onFocus={() => handleInputFocus('fullName')}
            onBlur={handleInputBlur}
            placeholder="Введите ваше полное имя"
            required={true}
            error={errors.fullName}
            isActive={activeField === 'fullName'}
          />

          <AplicationInput
            label="Номер телефона"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            onFocus={() => handleInputFocus('phone')}
            onBlur={handleInputBlur}
            placeholder="+7 (XXX) XXX-XX-XX"
            required={true}
            error={errors.phone}
            isActive={activeField === 'phone'}
            maxLength={18}
          />

          <AplicationInput
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            onFocus={() => handleInputFocus('email')}
            onBlur={handleInputBlur}
            placeholder="your@email.com"
            error={errors.email}
            isActive={activeField === 'email'}
          />
        </form>
      </div>

      {isDevelopmentMode && (
        <div className="dev-controls">
          <button 
            className="submit-button"
            onClick={handleSubmit}
          >
            📨 Отправить данные (тест)
          </button>
          <div className="dev-info">
            <p>В режиме Telegram кнопка отправки будет внизу экрана</p>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>© 2024 Берег Дона. Все права защищены.</p>
      </footer>
    </div>
  );
};

export default Application;