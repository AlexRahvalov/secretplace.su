import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>О нас</h3>
          <p>SecretPlace.su - Уютный сервер Minecraft с дружелюбным сообществом</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} SecretPlace.su. Все права защищены.</p>
      </div>
    </footer>
  );
};

export default Footer; 