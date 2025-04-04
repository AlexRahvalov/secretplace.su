import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import '@assets/css/App.css';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import { AuthProvider, useAuth } from './context/AuthContext';

// Компонент для защиты маршрутов
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Показываем загрузку, пока проверяем авторизацию
  if (loading) {
    return <div>Загрузка...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App; 