import React, { useCallback, useEffect, useState, useRef } from 'react';
import AplicationInput from './AplicationInput';
import { useTelegram } from '../hooks/useTelegramAPI';
import useApi from '../hooks/useAPI';
import SubmitStatus from './SubmitStatus';

const Application = () => {
  const { user, setupMainButton, isLoading, mainButton } = useTelegram();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: ''
  });
  const [errors, setErrors] = useState({
    fullName: '',
    phone: ''
  });

  const { aplicationRequest } = useApi()
  const formDataRef = useRef(formData);
  const errorRef = useRef(errors)
  const [submitStatus, setSubmitStatus] = useState('idle');// 'idle', 'loading', 'success' , 'error'
  
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    errorRef.current = errors;
  }, [errors]);

  const claenForm = useCallback(()=>{
    setFormData({
      fullName: '',
      phone: ''
    });
    setTimeout(()=>{
    if (window.Telegram?.WebApp?.close) {
      window.Telegram.WebApp.close();
    }}, 1000)
  },[])

  const formatPhone = useCallback((value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length === 1) return cleaned === '7' ? '+7 (' : `+7 (${cleaned}`;
    if (cleaned.length <= 4) return `+7 (${cleaned.slice(1)}`;
    if (cleaned.length <= 7) return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4)}`;
    if (cleaned.length <= 9) return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
  }, []);

  const validatePhone = useCallback((phone) => {
    if (!phone || typeof phone !== 'string') return false;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 11) return false;
    const validStarts = ['79', '89', '77', '87'];
    const startDigits = cleaned.substring(1, 3);
    return cleaned.startsWith('7') || cleaned.startsWith('8') && validStarts.includes(startDigits);
  }, []);

  const validateFullName = useCallback((fullName) => {
    if (!fullName || typeof fullName !== 'string') return false;
    const trimmedName = fullName.trim();
    const nameParts = trimmedName.split(/\s+/).filter(part => part.length > 0);
    const cyrillicRegex = /^[а-яё\s-]+$/i;
    const isValidCyrillic = nameParts.every(part => cyrillicRegex.test(part));
    return nameParts.length === 3 && isValidCyrillic;
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'phone') {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length <= 11) {
        setFormData(prev => ({
          ...prev,
          [name]: formatPhone(value)
        }));
      }
    } else {
      const processedValue  = value.split(' ').map(word => {
        if (word.length > 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        return word;})
        .join(' ');
      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }
  }, [formatPhone]);

  const showErrorAnimation = useCallback((fieldName, message) => {
    setErrors(prev => ({ 
      ...prev, 
      [fieldName]: message 
    }));
    setTimeout(() => {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }, 3000);
  }, []);
  
  const handlerSubmitMainButton = useCallback(async () => {
    const currentFormData = formDataRef.current;
    const newErrors = {};
    if (!validateFullName(currentFormData.fullName)) {
      newErrors.fullName = 'Пожалуйста, введите ФИО';
    }
    
    const cleanedPhone = currentFormData.phone.replace(/\D/g, '');
    if (!validatePhone(currentFormData.phone)) {
      newErrors.phone = 'Введите корректный номер телефона';
    }
  
    // Если есть ошибки - показываем все через showErrorAnimation
    if (Object.keys(newErrors).length > 0) {
      // Показываем все ошибки одновременно
      Object.entries(newErrors).forEach(([field, message]) => {
        showErrorAnimation(field, message);
      });
      return;
    }
  
    const applicationData = {
      full_name: currentFormData.fullName.trim(),
      telegram_id: user?.id?.toString() || 'unknown',
      telegram_user_name: user?.username || 'unknown',
      phone_number: cleanedPhone
    };
    console.log('Отправка данных:', applicationData);
  
    setSubmitStatus('loading');
    const success = await aplicationRequest(currentFormData.fullName.trim(), user?.id?.toString() || 'unknown', user?.username || 'unknown', cleanedPhone)
    if (success) {
      setSubmitStatus('success');
      claenForm()
      mainButton.disable()
    } else {
      setSubmitStatus('error');
      claenForm()
    }
  }, [user, aplicationRequest, validatePhone, validateFullName, claenForm, showErrorAnimation]);

  useEffect(() => {
    
    if(!isLoading){
      setupMainButton("Отправить заявку", handlerSubmitMainButton, {color: "#e68a00", textColor: "#ffffff"});
    }
  }, [setupMainButton, isLoading]);

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

  if (submitStatus === 'loading' || submitStatus === 'success' || submitStatus==='error') {
    const messages = {
      loading: 'Отправляем заявку...',
      success: 'Заявка отправлена!',
      error: 'Ошибка отправки. Попробуйте еще раз.'
    };
    
    return (
      <SubmitStatus 
        status={submitStatus}
        message={messages[submitStatus]}
      />
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
      </header>

      <div className="user-info-card">
        <h3>
          <div className="user-avatar">
            {user?.photo_url ? (
              <img src={user.photo_url} alt="Avatar" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
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
          <p style={{ display: "flex", justifyContent: "center" }}>Режим разработки</p>
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
            placeholder="Введите ваше полное имя"
            required
            error={errors.fullName}
          />

          <AplicationInput
            label="Номер телефона"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+7 (999) 999-99-99"
            required
            error={errors.phone}
          />
        </form>
      </div>

      <footer className="footer">
        <p>© 2024 Берег Дона. Все права защищены.</p>
      </footer>
    </div>
  );
};

export default Application;