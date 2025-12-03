import  { useCallback } from 'react';


const tg = window.Telegram.WebApp;

// В вашем useAPI.js
const useApi = () => {

    const initData = tg.initData;
    const domain = process.env.SERVER_HOST || 'https://bdapi.loca.lt'


    const aplicationRequestV2 = useCallback(async (fullName, telegramId, telegramUserName, phoneNumber, vk_username, creative_skills) => {
      try {
        const response = await fetch(`${domain}/api/application/v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "X-Telegram-Init-Data" : initData,
          },
          mode: 'cors', // Явно указываем CORS mode
          credentials: 'omit',
          body: JSON.stringify({
            full_name: fullName,
            telegram_id: telegramId,
            telegram_user_name: telegramUserName,
            phone_number: phoneNumber,
            vk_username : vk_username,
            creative_skills : creative_skills
          })
        }); 
        return response.ok;
      } catch (error) {
        console.error('API Error:', error);
        return false;
      }
    }, [domain, initData]);

    

    const aplicationRequest = useCallback(async (fullName, telegramId, telegramUserName, phoneNumber) => {
      try {
        const response = await fetch(`${domain}/api/application`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "X-Telegram-Init-Data" : initData,
          },
          mode: 'cors', // Явно указываем CORS mode
          credentials: 'omit',
          body: JSON.stringify({
            full_name: fullName,
            telegram_id: telegramId,
            telegram_user_name: telegramUserName,
            phone_number: phoneNumber
          })
        });
        
        return response.ok;
      } catch (error) {
        console.error('API Error:', error);
        return false;
      }
    }, [domain, initData]);

    const getMeRequest = useCallback(async (telegramId) => {
      try {
        const url = new URL(`${domain}/api/users/me`);
        url.searchParams.append('telegram_id', telegramId);
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            "X-Telegram-Init-Data" : initData,
          },
          mode: 'cors', 
          credentials: 'omit',
        });
        const data = await response.json();
        return data;
        
      } catch (error) {
        console.error('API Error:', error);
        return null;
      }
    },[domain, initData])

    const getMeRequestV2 = useCallback(async (telegramId) => {
      try {
        const url = new URL(`${domain}/api/users/v2/me`);
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            "X-Telegram-Init-Data" : initData,
          },
          mode: 'cors', 
          credentials: 'omit',
        });
        const data = await response.json();
        return data;
        
      } catch (error) {
        console.error('API Error:', error);
        return null;
      }
    },[domain, initData])

    const getActiveApplications = useCallback(async (status = "active") => {
      try {
        const url = new URL(`${domain}/api/admin/application`);
        url.searchParams.append('status', status);
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            "X-Telegram-Init-Data" : initData,
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
        
      } catch (error) {
        console.error('API Error:', error);
        throw error;
      }
    }, [domain, initData]);
  
    const updateApplicationStatus = useCallback(async (applicationId, status) => {
      try {
        // Создаем URL с query параметром status
        const url = new URL(`${domain}/api/admin/application/${applicationId}`);
        url.searchParams.append('status', status);
        
        const response = await fetch(url.toString(), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            "X-Telegram-Init-Data" : initData,
          },
          body: JSON.stringify({}),
        });
        
        if (!response.ok) {
          // Получаем детали ошибки от сервера
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP error! status: ${response.status}. ${errorData.detail || ''}`);
        }
        
        return await response.json();
        
      } catch (error) {
        console.error('API Error:', error);
        throw error;
      }
    }, [domain, initData]);


    const updateApplicationStatusV2 = useCallback(async (applicationId, status) => {
      try {
        // Создаем URL с query параметром status
        const url = new URL(`${domain}/api/admin/application/${applicationId}/${status}`);
        const response = await fetch(url.toString(), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            "X-Telegram-Init-Data" : initData,
          },
          body: JSON.stringify({}),
        });
        
        if (!response.ok) {
          // Получаем детали ошибки от сервера
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP error! status: ${response.status}. ${errorData.detail || ''}`);
        }
        
        return await response.json();
        
      } catch (error) {
        console.error('API Error:', error);
        throw error;
      }
    }, [domain, initData]);
    return { 
      aplicationRequestV2, 
      aplicationRequest, 
      getMeRequest, 
      getMeRequestV2,
      getActiveApplications, 
      updateApplicationStatus,
      updateApplicationStatusV2
   };
  };

  export default useApi;