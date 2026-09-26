import React, { useState } from 'react';
import styles from './ResetPasswordPage.module.css';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ErrorBanner from '../components/ErrorBanner';
import { verifyResetToken, changePasswordReset } from '../services/ApiService';
import { mapApiError } from '../data/TaskRepository';

const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<{ message: string; id: number } | null>(null);

  const showError = (message: string) => {
    setError({ message, id: Date.now() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      showError('Falta el código');
      return;
    }
    if (newPassword !== confirmPassword) {
      showError('Las contraseñas no coinciden');
      return;
    }
    try {
      await verifyResetToken(token);
      await changePasswordReset(token, newPassword);
      navigate('/login');
    } catch (err: unknown) {
      const mapped = mapApiError(err);
      if (mapped.message === 'Reset token has expired') {
        showError('El código expiró. Pide uno nuevo.');
      } else if (mapped.code === 'unknown' && mapped.message === 'Error') {
        showError('No se pudo restablecer. Reintenta o pide un código nuevo.');
      } else {
        showError(mapped.message);
      }
    }
  };

  return (
    <div className={styles.container}>
      {error && <ErrorBanner key={error.id} message={error.message} onDismiss={() => setError(null)} />}
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Restablecer contraseña</h2>
        <div className={styles.field}>
          <label htmlFor="newPassword">Nueva contraseña:</label>
          <input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
        </div>
        <div className={styles.field}>
          <label htmlFor="confirmPassword">Confirmar contraseña:</label>
          <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        </div>
        <button type="submit" className={styles.submitBtn}>Restablecer</button>
        <p className={styles.link}><Link to="/forgot-password">Pedir otro código</Link></p>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
