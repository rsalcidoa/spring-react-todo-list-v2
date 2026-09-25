import React, { useState } from 'react';
import styles from './LoginPage.module.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password, () => navigate('/tasks'));
    } catch {
      setError('Invalid email or password');
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Login</h2>
        {error && <p className={styles.field}>{error}</p>}
        <div className={styles.field}>
          <label htmlFor="email">Email:</label>
          <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div className={styles.field}>
          <label htmlFor="password">Password:</label>
          <input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        <button type="submit" className={styles.submitBtn}>Entrar</button>
        <p className={styles.link}><Link to="/register">Don't have an account? Register</Link></p>
      </form>
    </div>
  );
};

export default LoginPage;
