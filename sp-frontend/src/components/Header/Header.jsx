import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '@assets/css/components/Header.css';
import Modal from '../Modal/Modal';
import LoginForm from '../Auth/LoginForm';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        setIsVisible(true);
      } else {
        setIsVisible(currentScrollY < lastScrollY);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const handleLogin = (success) => {
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className={`header ${isVisible ? 'visible' : 'hidden'}`}>
        <nav className="header-nav">
          <div className="nav-left">
            <Link to="/" className="nav-logo">SecretPlace</Link>
          </div>
          
          <button 
            className="mobile-menu-button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Открыть меню"
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 10H34" stroke="white" strokeWidth="3.33333" strokeLinecap="square" strokeLinejoin="round"/>
              <path d="M6 20H34" stroke="white" strokeWidth="3.33333" strokeLinecap="square" strokeLinejoin="round"/>
              <path d="M6 30H34" stroke="white" strokeWidth="3.33333" strokeLinecap="square" strokeLinejoin="round"/>
            </svg>
          </button>

          {isAuthenticated ? (
            <div className="user-controls">
              <Link to="/profile" className="nav-link profile-link">
                <span className="username">{user?.username}</span>
              </Link>
              <button 
                onClick={handleLogout} 
                className="logout-button" 
                aria-label="Выйти"
                title="Выйти"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21C10.2211 20.9984 8.48259 20.4697 7.004 19.4807C5.52542 18.4916 4.37308 17.0866 3.69255 15.443C3.01201 13.7995 2.8338 11.9911 3.18041 10.2463C3.52702 8.50153 4.38292 6.89859 5.63999 5.63995C5.70894 5.56919 5.79135 5.51296 5.88238 5.47456C5.97341 5.43616 6.0712 5.41638 6.16999 5.41638C6.26879 5.41638 6.36658 5.43616 6.4576 5.47456C6.54863 5.51296 6.63105 5.56919 6.69999 5.63995C6.84044 5.78058 6.91933 5.9712 6.91933 6.16995C6.91933 6.3687 6.84044 6.55933 6.69999 6.69995C5.96312 7.38657 5.3721 8.21458 4.96218 9.13457C4.55226 10.0546 4.33184 11.0477 4.31408 12.0547C4.29631 13.0618 4.48155 14.062 4.85877 14.9959C5.23598 15.9298 5.79742 16.7781 6.50961 17.4903C7.2218 18.2025 8.07013 18.764 9.00402 19.1412C9.9379 19.5184 10.9382 19.7036 11.9452 19.6859C12.9522 19.6681 13.9454 19.4477 14.8654 19.0378C15.7854 18.6278 16.6134 18.0368 17.3 17.3C17.9978 16.605 18.5515 15.779 18.9294 14.8695C19.3072 13.96 19.5017 12.9848 19.5017 12C19.5017 11.0151 19.3072 10.0399 18.9294 9.13039C18.5515 8.22088 17.9978 7.39493 17.3 6.69995C17.1595 6.55933 17.0807 6.3687 17.0807 6.16995C17.0807 5.9712 17.1595 5.78058 17.3 5.63995C17.3689 5.56919 17.4514 5.51296 17.5424 5.47456C17.6334 5.43616 17.7312 5.41638 17.83 5.41638C17.9288 5.41638 18.0266 5.43616 18.1176 5.47456C18.2086 5.51296 18.291 5.56919 18.36 5.63995C19.6171 6.89859 20.473 8.50153 20.8196 10.2463C21.1662 11.9911 20.988 13.7995 20.3074 15.443C19.6269 17.0866 18.4746 18.4916 16.996 19.4807C15.5174 20.4697 13.7789 20.9984 12 21Z" fill="currentColor"/>
                  <path d="M12 12.75C11.8019 12.7474 11.6126 12.6676 11.4725 12.5275C11.3324 12.3874 11.2526 12.1981 11.25 12V4C11.25 3.80109 11.329 3.61032 11.4697 3.46967C11.6103 3.32902 11.8011 3.25 12 3.25C12.1989 3.25 12.3897 3.32902 12.5303 3.46967C12.671 3.61032 12.75 3.80109 12.75 4V12C12.7474 12.1981 12.6676 12.3874 12.5275 12.5275C12.3874 12.6676 12.1981 12.7474 12 12.75Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          ) : (
            <button onClick={() => setIsModalOpen(true)} className="cabinet-button">
              Кабинет
            </button>
          )}
        </nav>
      </header>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-header">
          <h2 style={{ color: 'white', margin: 0 }}>Меню</h2>
          <button 
            className="mobile-menu-close"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            ✕
          </button>
        </div>
        <div className="mobile-menu-items">
          {isAuthenticated ? (
            <>
              <Link 
                to="/profile" 
                className="mobile-menu-item"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Профиль
              </Link>
              <button 
                onClick={handleLogout}
                className="mobile-menu-item"
                style={{ background: 'none', border: 'none', color: '#dc3545', textAlign: 'left', padding: '0.5rem 0' }}
              >
                Выйти
              </button>
            </>
          ) : (
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsModalOpen(true);
              }}
              className="mobile-menu-item"
              style={{ background: 'none', border: 'none', color: 'white', textAlign: 'left', padding: '0.5rem 0' }}
            >
              Кабинет
            </button>
          )}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <LoginForm onLogin={handleLogin} />
      </Modal>
    </>
  );
};

export default Header; 