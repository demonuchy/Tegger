// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import Application from './components/Application';
import Home from './components/Home';
import './App.css';

// Компонент для маршрутизации с проверкой пользователя
const AppRoutes = () => {
  const { userData, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="app-wrapper">
        <div className="page-loader">
          <div className="loader-content">
            <div className="loader-spinner"></div>
            <p className="loader-text">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  // Если пользователь существует и имеет данные - показываем Home, иначе Application
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
          <AppRoutes />
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;