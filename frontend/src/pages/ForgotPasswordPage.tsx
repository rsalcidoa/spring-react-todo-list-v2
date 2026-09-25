import React, { useState } from 'react';
import styles from './ForgotPasswordPage.module.css';
import { Link } from 'react-router-dom';
import ErrorBanner from '../components/ErrorBanner';
import { requestReset } from '../services/ApiService';
import { validateEmail } from '../services/validateEmail';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; id: number } | null>(null);

  const showError = (message: string) => {
    setError({ message, id: Date.now() });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      showError('Invalid email format');
      return;
    }
    try {
      const res = await requestReset(email);
      const returnedToken = res.data.token as string;
      if (returnedToken && returnedToken.length > 0) {
        setToken(returnedToken);
      } else {
        showError('If the email is registered, a reset code has been generated');
      }
    } catch {
      showError('Failed to request password reset');
    }
  };

  return (
    <div className={styles.container}>
      {error && <ErrorBanner key={error.id} message={error.message} onDismiss={() => setError(null)} />}
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Forgot Password</h2>
        <div className={styles.field}>
          <label htmlFor="email">Email:</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <button type="submit" className={styles.submitBtn}>Send reset code</button>

        {token && (
          <div className={styles.tokenBox}>
            <p className={styles.tokenLabel}>Your reset code:</p>
            <p className={styles.tokenValue}>{token}</p>
            <Link to={`/reset/${token}`}>Continue to reset</Link>
          </div>
        )}

        <p className={styles.link}><Link to="/login">Back to login</Link></p>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
