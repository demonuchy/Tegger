// src/contexts/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegramAPI';
import useApi from '../hooks/useAPI';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const { user: telegramUser } = useTelegram();
  const { getMeRequest } = useApi();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (telegramUser?.id) {
      fetchUserData();
    }
  }, [telegramUser]);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!telegramUser?.id) {
        throw new Error('Telegram user data not available');
      }

      const response = await getMeRequest(telegramUser.id.toString());
      console.log("User data", response.user);
      
      if (response.user) {
        setUserData(response.user);
      } else {
        // Если пользователь не найден, создаем базовые данные
        setUserData({
          id: telegramUser.id,
          full_name: telegramUser.first_name + (telegramUser.last_name ? ` ${telegramUser.last_name}` : ''),
          username: telegramUser.username,
          is_admin: false,
          created_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      
      if (err.response?.status === 404 || err.message?.includes('404') || err.message?.includes('not found')) {
        // Создаем временного пользователя если не найден в базе
        setUserData({
          id: telegramUser.id,
          full_name: telegramUser.first_name + (telegramUser.last_name ? ` ${telegramUser.last_name}` : ''),
          username: telegramUser.username,
          is_admin: false,
          created_at: new Date().toISOString()
        });
      } else {
        setError('Ошибка загрузки данных пользователя');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserData = (newData) => {
    setUserData(prev => ({ ...prev, ...newData }));
  };

  const value = {
    userData,
    telegramUser,
    isLoading,
    error,
    refetchUser: fetchUserData,
    updateUserData
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};