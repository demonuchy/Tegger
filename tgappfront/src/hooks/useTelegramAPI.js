// src/hooks/useTelegram.js
import { useState, useEffect } from 'react';

export const useTelegram = () => {
  const [tg, setTg] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);

  useEffect(() => {
    const detectEnvironment = () => {
      // Проверяем различные признаки Telegram WebApp
      const isInTelegram = (
        window.Telegram &&
        window.Telegram.WebApp &&
        window.Telegram.WebApp.initData &&
        window.Telegram.WebApp.platform !== 'unknown'
      );

      console.log('Environment detection:', {
        hasTelegram: !!window.Telegram,
        hasWebApp: !!window.Telegram?.WebApp,
        hasInitData: !!window.Telegram?.WebApp?.initData,
        platform: window.Telegram?.WebApp?.platform,
        isInTelegram
      });

      if (isInTelegram) {
        const telegram = window.Telegram.WebApp;
        setTg(telegram);
        
        telegram.ready();
        telegram.expand();
        
        const userData = telegram.initDataUnsafe?.user;
        setUser(userData);
        
        setIsLoading(false);
        setIsDevelopmentMode(false);
        console.log('✅ Running in Telegram WebApp');
      } else {
        // Режим разработки
        console.log('🚫 Running in development mode (browser)');
        setUser({
          id: 123456789,
          first_name: 'Иван',
          last_name: 'Иванов',
          username: 'ivanov_test',
          photo_url: null
        });
        setIsLoading(false);
        setIsDevelopmentMode(true);
      }
    };

    detectEnvironment();
  }, []);

  // Остальные функции остаются без изменений
  const showAlert = (message) => {
    if (tg && tg.showAlert) {
      try {
        tg.showAlert(message);
      } catch (error) {
        console.warn('Telegram alert failed, using native alert:', error);
        alert(message);
      }
    } else {
      alert(message);
    }
  };

  const sendData = (data) => {
    if (tg && tg.sendData) {
      try {
        tg.sendData(data);
        return true;
      } catch (error) {
        console.warn('Telegram sendData failed:', error);
        return false;
      }
    }
    return false;
  };

  const setupMainButton = (text, onClick) => {
    if (tg && tg.MainButton) {
      try {
        tg.MainButton
          .setText(text)
          .show()
          .onClick(onClick);
        return true;
      } catch (error) {
        console.warn('Telegram MainButton setup failed:', error);
        return false;
      }
    }
    return false;
  };

  return {
    tg,
    user,
    isLoading,
    isDevelopmentMode,
    showAlert,
    sendData,
    setupMainButton
  };
};