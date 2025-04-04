import React from 'react';
import '@assets/css/pages/Home.css';
import HeroSection from '../../components/Home/HeroSection';
import ServerInfo from '../../components/Home/ServerInfo';

const Home = () => {
  return (
    <div className="home-page">
      <HeroSection />
      <ServerInfo />
    </div>
  );
};

export default Home; 