// src/hooks/useTelegramAPI.js
import { useState, useEffect, useCallback } from 'react';

export const useTelegram = () => {
  const [tg, setTg] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);
  const [mainButton, setMainButton] = useState(null);

  useEffect(() => {
    const initializeTelegram = () => {
      console.log('🔄 Initializing Telegram WebApp...');

      // ПРАВИЛЬНОЕ ОПРЕДЕЛЕНИЕ РЕЖИМА TELEGRAM
      const isInTelegram = (
        window.Telegram &&
        window.Telegram.WebApp &&
        window.Telegram.WebApp.initData && // initData может быть пустой строкой, но должен существовать
        window.Telegram.WebApp.platform && // platform тоже должен существовать в Telegram
        window.Telegram.WebApp.platform !== 'unknown' // исключаем поддельные окружения
      );

      console.log('Environment detection:', {
        hasTelegram: !!window.Telegram,
        hasWebApp: !!window.Telegram?.WebApp,
        hasInitData: !!window.Telegram?.WebApp?.initData,
        platform: window.Telegram?.WebApp?.platform,
        version: window.Telegram?.WebApp?.version,
        initDataLength: window.Telegram?.WebApp?.initData?.length,
        isInTelegram
      });

      if (isInTelegram) {
        console.log('✅ Running in REAL Telegram');
        const telegram = window.Telegram.WebApp;
        telegram.expand();
        telegram.ready();
        const userData = telegram.initDataUnsafe?.user;
        console.log('👤 User data from Telegram:', userData);
        const mainBtn = telegram.MainButton;
        console.log('🔘 Main Button available:', !!mainBtn);
        setTg(telegram);
        setMainButton(mainBtn);
        setUser(userData);
        setIsLoading(false);
        setIsDevelopmentMode(false);
        
        console.log('✅ Telegram WebApp initialized successfully');
        
      } else {
        // Режим разработки - ДОБАВЛЕНА ПРОВЕРКА НА ПОДДЕЛЬНЫЕ ОКРУЖЕНИЯ
        console.log('🚫 Running in development mode (browser)');
        
        // Проверяем, не пытается ли кто-то подделать Telegram WebApp
        const isFakeTelegram = (
          window.Telegram && 
          window.Telegram.WebApp && 
          (!window.Telegram.WebApp.platform || window.Telegram.WebApp.platform === 'unknown')
        );
        
        if (isFakeTelegram) {
          console.warn('⚠️ Fake Telegram environment detected, forcing development mode');
        }
        
        // Устанавливаем тестовые данные
        setUser({
          id: 123456789,
          first_name: 'Иван',
          last_name: 'Иванов',
          username: 'ivanov_test',
          language_code: 'ru',
          allows_write_to_pm: true,
          is_premium: true
        });
        setIsLoading(false);
        setIsDevelopmentMode(true);
        
        console.log('✅ Development mode initialized with test user');
      }
    };

    // Задержка для надежной инициализации
    setTimeout(initializeTelegram, 100);
  }, []);

  const showAlert = useCallback((message) => {
    console.log('💬 Showing alert:', message);
    if (tg && tg.showAlert) {
      try {
        tg.showAlert(message);
        return true;
      } catch (error) {
        console.warn('❌ Telegram alert failed, using native alert:', error);
        alert(message);
        return false;
      }
    } else {
      alert(message);
      return false;
    }
  }, [tg]);

  const sendData = useCallback((data) => {
    console.log('🔄 Attempting to send data:', data);
    
    if (tg && tg.sendData) {
      try {
        const dataToSend = typeof data === 'string' ? data : JSON.stringify(data);
        
        console.log('📤 Sending data to bot:', dataToSend);
        tg.sendData(dataToSend);
        
        console.log('✅ Data sent successfully via Telegram WebApp');
        return true;
        
      } catch (error) {
        console.error('❌ Telegram sendData failed:', error);
        showAlert(`Ошибка отправки: ${error.message}`);
        return false;
      }
    } else {
      console.error('❌ Telegram WebApp not available');
      
      if (isDevelopmentMode) {
        console.log('💡 Development mode: simulating data send', data);
        showAlert('Данные отправлены (режим разработки)');
        return true;
      } else {
        showAlert('Ошибка: Telegram WebApp не доступен');
        return false;
      }
    }
  }, [tg, showAlert, isDevelopmentMode]);

  const setupMainButton = useCallback((text, onClick, options = {}) => {
    console.log('🔄 Setting up main button:', text);
    
    // В РЕЖИМЕ РАЗРАБОТКИ ВСЕГДА ВОЗВРАЩАЕМ true, ЧТОБЫ КОМПОНЕНТ НЕ ЛОМАЛСЯ
    if (isDevelopmentMode) {
      console.log('💡 Development mode: MainButton setup simulated');
      return true;
    }
    
    if (mainButton) {
      try {
        // Сбрасываем предыдущие обработчики
        mainButton.offClick(onClick);
        
        // Настраиваем кнопку
        mainButton
          .setText(text || 'Отправить')
          .show();
        
        // Применяем опции
        if (options.color) {
          mainButton.setParams({ color: options.color });
        }
        if (options.textColor) {
          mainButton.setParams({ text_color: options.textColor });
        }
        if (options.isActive !== undefined) {
          options.isActive ? mainButton.enable() : mainButton.disable();
        } else {
          mainButton.enable();
        }
        
        // Добавляем обработчик
        mainButton.onClick(onClick);
        
        console.log('✅ Main button setup successfully');
        return true;
        
      } catch (error) {
        console.warn('❌ Telegram MainButton setup failed:', error);
        return false;
      }
    } else if (tg && tg.MainButton) {
      // Если mainButton не в состоянии, но доступен через tg
      try {
        const btn = tg.MainButton;
        btn.offClick(onClick);
        btn.setText(text || 'Отправить')
            .show()
            .enable()
            .onClick(onClick);
        
        console.log('✅ Main button setup via tg successfully');
        return true;
      } catch (error) {
        console.warn('❌ Telegram MainButton setup via tg failed:', error);
        return false;
      }
    } else {
      console.warn('⚠️ MainButton not available');
      return false;
    }
  }, [mainButton, tg, isDevelopmentMode]);

  const hideMainButton = useCallback(() => {
    // В РЕЖИМЕ РАЗРАБОТКИ ВСЕГДА ВОЗВРАЩАЕМ true
    if (isDevelopmentMode) {
      console.log('💡 Development mode: MainButton hide simulated');
      return true;
    }
    
    if (mainButton) {
      try {
        mainButton.hide();
        return true;
      } catch (error) {
        console.warn('❌ Failed to hide MainButton:', error);
        return false;
      }
    } else if (tg && tg.MainButton) {
      tg.MainButton.hide();
      return true;
    }
    return false;
  }, [mainButton, tg, isDevelopmentMode]);

  const updateMainButton = useCallback((params) => {
    // В РЕЖИМЕ РАЗРАБОТКИ ВСЕГДА ВОЗВРАЩАЕМ true
    if (isDevelopmentMode) {
      console.log('💡 Development mode: MainButton update simulated');
      return true;
    }
    
    if (mainButton) {
      try {
        mainButton.setParams(params);
        return true;
      } catch (error) {
        console.warn('❌ Failed to update MainButton:', error);
        return false;
      }
    } else if (tg && tg.MainButton) {
      tg.MainButton.setParams(params);
      return true;
    }
    return false;
  }, [mainButton, tg, isDevelopmentMode]);

  const closeWebApp = useCallback(() => {
    if (tg && tg.close) {
      try {
        tg.close();
        return true;
      } catch (error) {
        console.warn('❌ Failed to close WebApp:', error);
        return false;
      }
    }
    return false;
  }, [tg]);

  return {
    tg,
    user,
    isLoading,
    isDevelopmentMode,
    showAlert,
    sendData,
    setupMainButton,
    hideMainButton,
    updateMainButton,
    closeWebApp
  };
};