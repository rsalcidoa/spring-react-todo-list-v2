import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/ApiService';
import { getApiStatus, getApiMessage } from '../data/TaskRepository';
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
      showError('Formato de email inválido');
      return;
    }
    try {
      await api.post('/auth/register', { email, password });
      await auth.login(email, password);
      navigate('/tasks');
    } catch (error: unknown) {
      if (getApiStatus(error) === 409) {
        const message = getApiMessage(error);
        showError(message === 'Error' ? 'Este email ya está registrado' : message);
      } else {
        showError('Error en registro');
      }
    }
  };

  return (
    <div className={styles.container}>
      {error && <ErrorBanner key={error.id} message={error.message} onDismiss={() => setError(null)} />}
      <form onSubmit={onSubmit} className={styles.form}>
        <h2 className={styles.title}>Registrarse</h2>
        <div className={styles.field}>
          <label>Correo electrónico</label>
          <input value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className={styles.field}>
          <label>Contraseña</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className={styles.submitBtn}>Registrarse</button>
        <p className={styles.link}><Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link></p>
      </form>
    </div>
  );
}
