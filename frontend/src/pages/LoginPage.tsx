import React, { useState } from 'react';
import { useT } from '../i18n';
import styles from './LoginPage.module.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import ErrorBanner from '../components/ErrorBanner';
import AppControls from '../components/AppControls';
import { validateEmail } from '../services/validateEmail';

const LoginPage: React.FC = () => {
  const { t } = useT();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ message: string; id: number } | null>(null);

  const showError = (message: string) => {
    setError({ message, id: Date.now() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      showError(t('auth.invalidEmail'));
      return;
    }
    try {
      await login(email, password, () => navigate('/tasks'));
    } catch {
      showError(t('auth.login.error'));
    }
  };

  return (
    <div className={styles.container}>
      <AppControls />
      {error && <ErrorBanner key={error.id} message={error.message} onDismiss={() => setError(null)} />}
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>{t('auth.login.title')}</h2>
        <div className={styles.field}>
          <label htmlFor="email">{t('auth.emailLabel')}</label>
          <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">{t('auth.passwordLabel')}</label>
          <input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button type="submit" className={styles.submitBtn}>{t('auth.login.submit')}</button>
        <p className={styles.link}><Link to="/forgot-password">{t('auth.forgotLink')}</Link></p>
        <p className={styles.link}><Link to="/register">{t('auth.noAccount')}</Link></p>
      </form>
    </div>
  );
};

export default LoginPage;
