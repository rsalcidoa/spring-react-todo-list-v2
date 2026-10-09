import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/ApiService';
import { presentError } from '../services/errorPresenter';
import { useNavigate, Link } from 'react-router-dom';
import { useT } from '../i18n';
import styles from './RegisterPage.module.css';
import ErrorBanner from '../components/ErrorBanner';
import AppControls from '../components/AppControls';
import { validateEmail } from '../services/validateEmail';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ message: string; id: number } | null>(null);
  const { t } = useT();
  const auth = useAuth();
  const navigate = useNavigate();

  const showError = (message: string) => {
    setError({ message, id: Date.now() });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      showError(t('auth.invalidEmail'));
      return;
    }
    try {
      await api.post('/auth/register', { email, password });
      await auth.login(email, password);
      navigate('/tasks');
    } catch (error: unknown) {
      showError(presentError(error, t, {
        fallback: t('auth.register.error'),
        override: { conflict: t('auth.register.duplicate') },
      }));
    }
  };

  return (
    <div className={styles.container}>
      <AppControls />
      {error && <ErrorBanner key={error.id} message={error.message} onDismiss={() => setError(null)} />}
      <form onSubmit={onSubmit} className={styles.form}>
        <h2 className={styles.title}>{t('auth.register.title')}</h2>
        <div className={styles.field}>
          <label>{t('auth.email')}</label>
          <input value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className={styles.field}>
          <label>{t('auth.password')}</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className={styles.submitBtn}>{t('auth.register.submit')}</button>
        <p className={styles.link}><Link to="/login">{t('auth.haveAccount')}</Link></p>
      </form>
    </div>
  );
}
