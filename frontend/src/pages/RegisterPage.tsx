import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/AuthService';
import { useNavigate, Link } from 'react-router-dom';
import styles from './RegisterPage.module.css';
import ErrorBanner from '../components/ErrorBanner';
import { validateEmail } from '../services/validateEmail';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ message: string; id: number } | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();

  const showError = (message: string) => {
    setError({ message, id: Date.now() });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      showError('Invalid email format');
      return;
    }
    try {
      await registerUser(email, password);
      await auth.login(email, password);
      navigate('/tasks');
    } catch (error: any) {
      if (error.response?.status === 409) {
        showError(error.response.data?.error || 'Este email ya está registrado');
      } else {
        showError('Error en registro');
      }
    }
  };

  return (
    <div className={styles.container}>
      {error && <ErrorBanner key={error.id} message={error.message} onDismiss={() => setError(null)} />}
      <form onSubmit={onSubmit} className={styles.form}>
        <h2 className={styles.title}>Register</h2>
        <div className={styles.field}>
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className={styles.field}>
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className={styles.submitBtn}>Register</button>
        <p className={styles.link}><Link to="/login">Already have an account? Login</Link></p>
      </form>
    </div>
  );
}
