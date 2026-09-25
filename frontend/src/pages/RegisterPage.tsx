import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/AuthService';
import { useNavigate, Link } from 'react-router-dom';
import styles from './RegisterPage.module.css';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerUser(email, password);
      await auth.login(email, password);
      navigate('/tasks');
    } catch (error: any) {
      if (error.response?.status === 409) {
        alert(error.response.data?.error || 'Este email ya está registrado');
      } else {
        alert('Error en registro');
      }
    }
  };

  return (
    <div className={styles.container}>
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
