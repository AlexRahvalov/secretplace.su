import React from 'react';
import '@assets/css/pages/Home.css';

const HeroSection = () => {
  return (
    <div className="home-header">
      <div className="home-header-content">
        <h1>ТАЙНОЕ МЕСТЕЧКО!</h1>
        <p>
          Уютный сервер Minecraft с дружелюбным сообществом
        </p>
        <div className="home-buttons">
          <a href="#" className="home-button primary">НАЧАТЬ ИГРУ ↗</a>
          <a href="#" className="home-button secondary">УЗНАТЬ БОЛЬШЕ</a>
        </div>
      </div>
    </div>
  );
};

export default HeroSection; 