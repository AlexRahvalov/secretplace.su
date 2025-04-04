import React, { useState } from 'react';
import { updateEmail, verifyEmailCode, resendVerificationCode } from '../../services/api';
import Modal from '../Modal/Modal';
import './EmailVerificationModal.css';

const EmailVerificationModal = ({ isOpen, onClose, onSuccess, currentEmail, isVerified }) => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  // Сброс состояния при открытии/закрытии модального окна
  React.useEffect(() => {
    if (isOpen) {
      setShowUnlinkConfirm(!!currentEmail);
      setEmail('');
      setVerificationCode('');
      setIsEmailSent(false);
      setError('');
    }
  }, [isOpen, currentEmail]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateEmail(email);
      setIsEmailSent(true);
      startResendTimer();
    } catch (error) {
      setError(error.message || 'Ошибка при отправке email');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyEmailCode(verificationCode);
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.message || 'Неверный код подтверждения');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;
    
    setError('');
    setLoading(true);

    try {
      await resendVerificationCode();
      startResendTimer();
    } catch (error) {
      setError(error.message || 'Ошибка при повторной отправке кода');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkEmail = async () => {
    setError('');
    setLoading(true);

    try {
      await updateEmail(''); // Отправляем пустую строку для отвязки почты
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.message || 'Ошибка при отвязке email');
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (showUnlinkConfirm) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <div className="email-verification-modal">
          <h2>Управление email</h2>
          
          {error && <div className="error-message">{error}</div>}

          <div className="current-email-info">
            <p>Текущий email: <strong>{currentEmail}</strong></p>
            <p className="email-status">
              Статус: <span className={isVerified ? 'verified' : 'pending'}>
                {isVerified ? 'Подтвержден' : 'Ожидает подтверждения'}
              </span>
            </p>
          </div>

          <div className="verification-actions">
            <button 
              type="button" 
              className="unlink-button"
              onClick={handleUnlinkEmail}
              disabled={loading}
            >
              {loading ? 'Отвязка...' : 'Отвязать email'}
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="email-verification-modal">
        <h2>{isEmailSent ? 'Подтверждение email' : 'Привязка email'}</h2>
        
        {error && <div className="error-message">{error}</div>}

        {!isEmailSent ? (
          <form onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email адрес:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Введите ваш email"
                required
                disabled={loading}
              />
            </div>
            <button 
              type="submit" 
              className="submit-button" 
              disabled={loading}
            >
              {loading ? 'Отправка...' : 'Отправить код'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit}>
            <div className="form-group">
              <label htmlFor="code">Код подтверждения:</label>
              <input
                type="text"
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Введите код из email"
                required
                disabled={loading}
              />
            </div>
            <div className="verification-actions">
              <button 
                type="submit" 
                className="submit-button" 
                disabled={loading}
              >
                {loading ? 'Проверка...' : 'Подтвердить'}
              </button>
              <button
                type="button"
                className="resend-button"
                onClick={handleResendCode}
                disabled={loading || resendTimer > 0}
              >
                {resendTimer > 0 
                  ? `Отправить повторно (${resendTimer}с)` 
                  : 'Отправить код повторно'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default EmailVerificationModal; 