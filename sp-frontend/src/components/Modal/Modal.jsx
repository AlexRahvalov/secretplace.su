import React, { useEffect, useState } from 'react';
import './Modal.css';

const Modal = ({ isOpen, onClose, children }) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // Время анимации
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`modal-overlay ${isClosing ? 'modal-exit' : ''}`} 
      onClick={handleClose}
    >
      <div 
        className={`modal-content ${isClosing ? 'modal-content-exit' : ''}`} 
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close" onClick={handleClose}>×</button>
        {children}
      </div>
    </div>
  );
};

export default Modal; 