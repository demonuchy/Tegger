// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';
import Application from './components/Application';
import LoadingSpinner from './components/LoaderSpiner';
import Home from './components/Home';
import './App.css';

// Компонент для проверки готовности приложения
const AppInitializer = ({ children }) => {
  const { isLoading, userData } = useUser();

  if (isLoading) {
    return (
      <LoadingSpinner 
        fullScreen={true}
        text="Загрузка профиля..." 
        size="large"
      />
    );
  }

  return children;
};

// Компонент для маршрутизации
const AppRoutes = () => {
  const { userData } = useUser();

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