import React, { useState } from 'react';
import styles from './ResetPasswordPage.module.css';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ErrorBanner from '../components/ErrorBanner';
import AppControls from '../components/AppControls';
import { verifyResetToken, changePasswordReset } from '../services/ApiService';
import { mapApiError } from '../data/TaskRepository';
import { useT } from '../i18n';

const ResetPasswordPage: React.FC = () => {
  const { t } = useT();
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
      showError(t('auth.reset.missingToken'));
      return;
    }
    if (newPassword !== confirmPassword) {
      showError(t('auth.reset.mismatch'));
      return;
    }
    try {
      await verifyResetToken(token);
      await changePasswordReset(token, newPassword);
      navigate('/login');
    } catch (err: unknown) {
      const mapped = mapApiError(err);
      if (mapped.message === 'Reset token has expired') {
        showError(t('auth.reset.expired'));
      } else if (mapped.code === 'unknown' && mapped.message === 'Error') {
        showError(t('auth.reset.failed'));
      } else {
        showError(mapped.message);
      }
    }
  };

  return (
    <div className={styles.container}>
      <AppControls />
      {error && <ErrorBanner key={error.id} message={error.message} onDismiss={() => setError(null)} />}
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>{t('auth.reset.title')}</h2>
        <div className={styles.field}>
          <label htmlFor="newPassword">{t('auth.reset.newPassword')}</label>
          <input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
        </div>
        <div className={styles.field}>
          <label htmlFor="confirmPassword">{t('auth.reset.confirmPassword')}</label>
          <input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
        </div>
        <button type="submit" className={styles.submitBtn}>{t('auth.reset.submit')}</button>
        <p className={styles.link}><Link to="/forgot-password">{t('auth.reset.requestAnother')}</Link></p>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
