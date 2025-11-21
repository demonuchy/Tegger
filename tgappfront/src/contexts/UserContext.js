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
        console.log("Пользователь не найден")
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Ошибка загрузки данных пользователя');
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