// components/Application.js
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useTelegram } from '../hooks/useTelegramAPI';
import useApi from '../hooks/useAPI';
import { useUser } from '../contexts/UserContext';
import SubmitStatus from './SubmitStatus';

const Application = () => {
  const { user: telegramUser, setupMainButton, mainButton } = useTelegram();
  const { refetchUser } = useUser();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    vkUsername: '',
    creativeSkills: ''
  });
  const [errors, setErrors] = useState({
    fullName: '',
    phone: '',
    vkUsername: '',
    creativeSkills: ''
  });

  const { aplicationRequestV2, aplicationRequest } = useApi()
  const formDataRef = useRef(formData);
  const errorRef = useRef(errors)
  const [submitStatus, setSubmitStatus] = useState('idle');
  
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    errorRef.current = errors;
  }, [errors]);

  const cleanForm = useCallback(() => {
    setFormData({
      fullName: '',
      phone: '',
      vkUsername: '',
      creativeSkills: ''
    });
    setTimeout(() => {
      if (window.Telegram?.WebApp?.close) {
        window.Telegram.WebApp.close();
      }
    }, 1000)
  }, [])

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

  const validateVkUsername = useCallback((username) => {
    if (!username || typeof username !== 'string') return false;
    const trimmed = username.trim();
    
    // Проверка формата VK username
    const vkRegex = /^[a-zA-Z0-9_.]+$/;
    const isValidFormat = vkRegex.test(trimmed);
    const isValidLength = trimmed.length >= 3 && trimmed.length <= 32;
    
    return isValidFormat && isValidLength;
  }, []);

  const validateCreativeSkills = useCallback((skills) => {
    if (!skills || typeof skills !== 'string') return true; // Опциональное поле
    
    const trimmed = skills.trim();
    // Максимальная длина 500 символов
    return trimmed.length <= 500;
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
    } else if (name === 'fullName') {
      const processedValue = value.split(' ').map(word => {
        if (word.length > 0) return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        return word;
      }).join(' ');
      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }));
    } else if (name === 'vkUsername') {
      // Убираем пробелы и преобразуем к нижнему регистру для VK username
      const processedValue = value.replace(/\s/g, '').toLowerCase();
      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
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
    
    // Валидация ФИО
    if (!validateFullName(currentFormData.fullName)) {
      newErrors.fullName = 'Пожалуйста, введите ФИО (только кириллица, 3 слова)';
    }
    
    // Валидация телефона
    const cleanedPhone = currentFormData.phone.replace(/\D/g, '');
    if (!validatePhone(currentFormData.phone)) {
      newErrors.phone = 'Введите корректный номер телефона';
    }
    
    // Валидация VK username
    if (!validateVkUsername(currentFormData.vkUsername)) {
      newErrors.vkUsername = 'Введите корректный VK username (только латинские буквы, цифры, _ и .)';
    }
    
    // Валидация творческих навыков
    if (!validateCreativeSkills(currentFormData.creativeSkills)) {
      newErrors.creativeSkills = 'Максимальная длина - 500 символов';
    }
  
    if (Object.keys(newErrors).length > 0) {
      Object.entries(newErrors).forEach(([field, message]) => {
        showErrorAnimation(field, message);
      });
      return;
    }
  
    const applicationData = {
      full_name: currentFormData.fullName.trim(),
      telegram_id: telegramUser?.id?.toString() || 'unknown',
      telegram_user_name: telegramUser?.username || 'unknown',
      phone_number: cleanedPhone,
      vk_username: currentFormData.vkUsername.trim(),
      creative_skills: currentFormData.creativeSkills.trim() || null,
    };
    console.log('Отправка данных:', applicationData);
  
    setSubmitStatus('loading');
    const success = await aplicationRequestV2(
      currentFormData.fullName.trim(), 
      telegramUser?.id?.toString() || 'unknown', 
      telegramUser?.username || 'unknown', 
      cleanedPhone,
      currentFormData.vkUsername.trim(),
      currentFormData.creativeSkills.trim() || null
    );
    
    if (success) {
      setSubmitStatus('success');
      setTimeout(() => {
        refetchUser();
      }, 2000);
      cleanForm()
      mainButton.disable()
    } else {
      setSubmitStatus('error');
      cleanForm()
    }
  }, [
    telegramUser, 
    aplicationRequestV2, 
    validatePhone, 
    validateFullName, 
    validateVkUsername,
    validateCreativeSkills,
    cleanForm, 
    showErrorAnimation, 
    refetchUser, 
    mainButton
  ]);

  useEffect(() => {
    setupMainButton("Отправить заявку", handlerSubmitMainButton, {color: "#e68a00", textColor: "#ffffff"});
  }, [setupMainButton, handlerSubmitMainButton]);

  if (['loading', 'success', 'error'].includes(submitStatus)) {
    const statusConfig = {
      loading: {
        message: 'Отправляем заявку...',
        description: 'Пожалуйста, подождите'
      },
      success: {
        message: 'Заявка отправлена!',
        description: 'С вами свяжутся в ближайшее время'
      },
      error: {
        message: 'Ошибка отправки. Попробуйте еще раз.',
        description: 'Проверьте соединение или попробуйте позже'
      }
    };
    
    const config = statusConfig[submitStatus];
    
    return (
      <SubmitStatus 
        status={submitStatus}
        message={config.message}
        description={config.description}
      />
    );
  }

  return (
    <div className="app-wrapper application-wrapper">
      <header className="application-top">
        <h1 className="application-heading">
          <span className="heading-text">Берег</span>
          <span className="heading-highlight">Дона</span>
        </h1>
        <p className="application-subheading">Заполните форму для вступления</p>
      </header>

      <div className="content-card" style={{padding: '25px', marginBottom: '30px'}}>
        <h3 style={{color: 'var(--text-accent)', marginBottom: '20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', fontSize: '1.3em'}}>
          <div className="user-image">
            {telegramUser?.photo_url ? (
              <img src={telegramUser.photo_url} alt="Avatar" />
            ) : (
              <div className="image-placeholder">
                {telegramUser?.first_name ? telegramUser.first_name[0].toUpperCase() : 'U'}
              </div>
            )}
          </div>
          Ваши данные
        </h3>
        {telegramUser ? (
          <>
            <div className="info-row">
              <span className="info-label">Telegram ID:</span>
              <span className="info-content">{telegramUser.id}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Имя:</span>
              <span className="info-content">{telegramUser.first_name}</span>
            </div>
            {telegramUser.last_name && (
              <div className="info-row">
                <span className="info-label">Фамилия:</span>
                <span className="info-content">{telegramUser.last_name}</span>
              </div>
            )}
            {telegramUser.username && (
              <div className="info-row">
                <span className="info-label">Username:</span>
                <span className="info-content">@{telegramUser.username}</span>
              </div>
            )}
          </>
        ) : (
          <p style={{ display: "flex", justifyContent: "center" }}>Режим разработки</p>
        )}
      </div>

      <div className="form-section">
        <form className="application-form">
          <div className="input-wrapper">
            <label className="input-title">ФИО *</label>
            <input
              className={`form-control ${errors.fullName ? 'error' : ''}`}
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Иванов Иван Иванович"
            />
            {errors.fullName && <div className="validation-error">{errors.fullName}</div>}
          </div>

          <div className="input-wrapper">
            <label className="input-title">Номер телефона *</label>
            <input
              className={`form-control ${errors.phone ? 'error' : ''}`}
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+7 (999) 999-99-99"
            />
            {errors.phone && <div className="validation-error">{errors.phone}</div>}
          </div>

          <div className="input-wrapper">
            <label className="input-title">VK Username *</label>
            <input
              className={`form-control ${errors.vkUsername ? 'error' : ''}`}
              type="text"
              name="vkUsername"
              value={formData.vkUsername}
              onChange={handleInputChange}
              placeholder="id123456789 или username"
            />
            {errors.vkUsername && <div className="validation-error">{errors.vkUsername}</div>}
          </div>

          <div className="input-wrapper">
            <label className="input-title">Творческие навыки и увлечения</label>
            <textarea
              className={`form-control textarea ${errors.creativeSkills ? 'error' : ''}`}
              name="creativeSkills"
              value={formData.creativeSkills}
              onChange={handleInputChange}
              placeholder="Опишите ваши творческие навыки, увлечения, хобби..."
              rows="4"
              maxLength="500"
            />
            {errors.creativeSkills && <div className="validation-error">{errors.creativeSkills}</div>}
            <div className="input-hint">
              {formData.creativeSkills.length}/500
            </div>
          </div>
        </form>
      </div>

      <footer className="page-footer">
        <p>© 2024 Берег Дона. Все права защищены.</p>
      </footer>
    </div>
  );    
};

export default Application;