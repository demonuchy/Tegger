
const domain = process.env.SERVER_HOST || 'https://bdapi.loca.lt'

// В вашем useAPI.js
const useApi = () => {
    const aplicationRequest = async (fullName, telegramId, telegramUserName, phoneNumber) => {
      try {
        const response = await fetch(`${domain}/api/application`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
    };
    return { aplicationRequest };
  };

  export default useApi;