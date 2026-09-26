import React, { useState } from 'react';
import styles from './ForgotPasswordPage.module.css';
import { Link } from 'react-router-dom';
import ErrorBanner from '../components/ErrorBanner';
import { requestReset } from '../services/ApiService';
import { validateEmail } from '../services/validateEmail';

const ForgotPasswordPage: React.FC = () => {
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
      showError('Formato de email inválido');
      return;
    }
    try {
      const res = await requestReset(email);
      const returnedToken = res.data.token as string;
      if (returnedToken && returnedToken.length > 0) {
        setToken(returnedToken);
      } else {
        showError('Si el email está registrado, se ha generado un código');
      }
    } catch {
      showError('No se pudo solicitar el restablecimiento. Reintenta');
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
      {error && <ErrorBanner key={error.id} message={error.message} onDismiss={() => setError(null)} />}
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Recuperar contraseña</h2>
        <div className={styles.field}>
          <label htmlFor="email">Correo electrónico:</label>
          <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <button type="submit" className={styles.submitBtn}>Enviar código</button>

        {token && (
          <div className={styles.tokenBox}>
            <p className={styles.tokenLabel}>Tu código:</p>
            <p className={styles.tokenValue} id="reset-token-value">{token}</p>
            <button type="button" onClick={handleCopy}>
              {copied ? '¡Copiado!' : 'Copiar'}
            </button>
            <Link to={`/reset/${token}`}>Continuar</Link>
          </div>
        )}

        <p className={styles.link}><Link to="/login">Volver</Link></p>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
