// src/App.js
import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [tg, setTg] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    email: ''
  });

  useEffect(() => {
    const initTelegramApp = () => {
      if (window.Telegram && window.Telegram.WebApp) {
        const telegram = window.Telegram.WebApp;
        setTg(telegram);
        
        telegram.ready();
        telegram.expand();
        
        setUser(telegram.initDataUnsafe?.user);
        
        telegram.MainButton
          .setText('Отправить данные')
          .show()
          .onClick(() => {
            handleSubmit();
          });
        
        setIsLoading(false);
      } else {
        setTimeout(initTelegramApp, 500);
      }
    };

    initTelegramApp();

    const timeoutId = setTimeout(() => {
      if (!tg) {
        console.warn('Telegram WebApp не загрузился, использую режим разработки');
        setIsLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [tg]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (!formData.fullName || !formData.phone) {
      if (tg) {
        tg.showAlert('Пожалуйста, заполните обязательные поля');
      } else {
        alert('Пожалуйста, заполните обязательные поля');
      }
      return;
    }

    const submitData = {
      ...formData,
      user: user || 'unknown'
    };

    if (tg) {
      tg.sendData(JSON.stringify(submitData));
      tg.showAlert('Данные успешно отправлены!');
    } else {
      console.log('Отправка данных:', submitData);
      alert('Данные успешно отправлены!');
    }
  };

  if (isLoading) {
    return (
      <div className="app loading-screen">
        <div className="loading">
          <div className="spinner orange-spinner"></div>
          <p>Загрузка приложения...</p>
        </div>
      </div>
    );
  }

  const isDevelopmentMode = !tg;

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
          {user.photo_url ? (
          <img src={user.photo_url} alt="Avatar" className="avatar-img" />
          ) : (
          <div className="avatar-placeholder">
            {user.first_name ? user.first_name[0].toUpperCase() : 'U'}
          </div>
          )}
          </div>
          Ваши данные
        </h3>
        <p><strong>Telegram ID:</strong> {user.id}</p>
        <p><strong>Имя:</strong> {user.first_name}</p>
        {user.last_name && <p><strong>Фамилия:</strong> {user.last_name}</p>}
        {user.username && <p><strong>Username:</strong> @{user.username}</p>}
      </div>

      <div className="form-container">
        <form className="registration-form">
          <div className="form-group">
            <label htmlFor="fullName">ФИО *</label>
            <input      
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Введите ваше полное имя"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Номер телефона *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+7 (XXX) XXX-XX-XX"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Адрес</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Введите ваш адрес"
              rows="3"
            />
          </div>
        </form>
      </div>

      

      <footer className="footer">
        <p>© 2024 Берег Дона. Все права защищены.</p>
      </footer>
    </div>
  );
}

export default App;