import React, { useState } from 'react';
import styles from './ForgotPasswordPage.module.css';
import { Link } from 'react-router-dom';
import ErrorBanner from '../components/ErrorBanner';
import AppControls from '../components/AppControls';
import { requestReset } from '../services/ApiService';
import { validateEmail } from '../services/validateEmail';
import { useT } from '../i18n';

const ForgotPasswordPage: React.FC = () => {
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
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
      const res = await requestReset(email);
      const returnedToken = res.data.token as string;
      if (returnedToken && returnedToken.length > 0) {
        setToken(returnedToken);
      } else {
        showError(t('auth.forgot.sentGeneric'));
      }
    } catch {
      showError(t('auth.forgot.requestFailed'));
    }
  };

  const handleCopy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      const el = document.getElementById('reset-token-value');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      <AppControls />
      {error && <ErrorBanner key={error.id} message={error.message} onDismiss={() => setError(null)} />}
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>{t('auth.forgot.title')}</h2>
        <div className={styles.field}>
          <label htmlFor="email">{t('auth.emailLabel')}</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <button type="submit" className={styles.submitBtn}>{t('auth.forgot.submit')}</button>

        {token && (
          <div className={styles.tokenBox}>
            <p className={styles.tokenLabel}>{t('auth.forgot.tokenLabel')}</p>
            <p className={styles.tokenValue} id="reset-token-value">{token}</p>
            <button type="button" onClick={handleCopy}>
              {copied ? t('auth.forgot.copied') : t('auth.forgot.copy')}
            </button>
            <Link to={`/reset/${token}`}>{t('auth.forgot.continue')}</Link>
          </div>
        )}

        <p className={styles.link}><Link to="/login">{t('auth.forgot.back')}</Link></p>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
