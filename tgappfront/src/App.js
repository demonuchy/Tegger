// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Error from './components/ErrorScreen';
import { UserProvider, useUser } from './contexts/UserContext';
import Application from './components/ApplicationV2';
import LoadingSpinner from './components/LoaderSpiner';
import DocumentProcessor from './components/StandaloneCamera';
import Home from './components/Home';
import './App.css';


const DEV = true;

// Компонент для проверки готовности приложения
const AppInitializer = ({ children }) => {
  const { isLoading, userData, error } = useUser();
  if (DEV){
    const isLoading = false
    const error = false
  }
   
  if (true) {
    return (
      <LoadingSpinner 
        fullScreen={true} 
        size="large"
      />
    );
  }

  if(error){
    return(
    <Error />
    )
  }
  return children;
};

  

// Компонент для маршрутизации
const AppRoutes = () => {
  const { userData } = useUser();
  if (DEV){
    const userData = {
      id: 1,
      // Паспортные данные
      full_name: "Бесс Дима Кишка",
      passport_series : "1111",
      passport_number : "222222",
      actual_address : "Мухосранск",
      address_registered : "Мухосранск",
      // доп данные
      educational_group : "ЖР342",
      educational_faculty : "Факультет",
      creative_skills : "Круто сру на подоконник",
      phone_number: "79999999999",
      //  Telegram данные
      telegram_id: "1111111111",
      telegram_user_name: "test",
      // vk
      vk_username : "testvk",
      //  meta
      is_active : true,
      is_admin : true,
      status : "Разработчик"
    };
  }


  return (
    <Routes>
      <Route 
        path="/application" 
        element={!userData ? <Application /> : <Navigate to="/home" replace />} 
      />
      <Route 
        path="/home" 
        element={userData ? <Home /> : <Navigate to="/application" replace />} 
      />
      <Route 
        path="/" 
        element={
          <Navigate to={userData ? "/home" : "/application"} replace />
        } 
      />
      <Route 
        path="*" 
        element={<Navigate to="/" replace />} 
      />
    </Routes>
  );
};

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="app-wrapper">
          <AppInitializer>
            <AppRoutes />
          </AppInitializer>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;