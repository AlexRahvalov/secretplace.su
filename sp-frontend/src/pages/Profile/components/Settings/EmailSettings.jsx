import React, { useState } from 'react';
import { updateEmail, verifyEmailCode } from '../../../../services/api';
import './EmailSettings.css';

const EmailSettings = () => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await updateEmail(email);
      setIsEmailSent(true);
      setSuccess('Код подтверждения отправлен на вашу почту');
    } catch (err) {
      setError(err.message || 'Произошла ошибка при обновлении email');
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await verifyEmailCode(verificationCode);
      setSuccess('Email успешно подтвержден');
      setIsEmailSent(false);
      setVerificationCode('');
      setEmail('');
    } catch (err) {
      setError(err.message || 'Неверный код подтверждения');
    }
  };

  return (
    <div className="email-settings">
      <h3>Управление email</h3>
      
      <form onSubmit={handleEmailSubmit} className="email-form">
        <div className="form-group">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Введите новый email"
            required
            disabled={isEmailSent}
          />
        </div>
        <button type="submit" className="submit-button" disabled={isEmailSent}>
          Обновить email
        </button>
      </form>

      {isEmailSent && (
        <form onSubmit={handleVerifyEmail} className="verification-form">
          <div className="form-group">
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Введите код подтверждения"
              required
            />
          </div>
          <button type="submit" className="verify-button">
            Подтвердить
          </button>
        </form>
      )}

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default EmailSettings; 