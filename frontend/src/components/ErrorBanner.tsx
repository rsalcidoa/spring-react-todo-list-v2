import React, { useState, useEffect, useCallback } from 'react';
import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

let nextId = 0;

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => {
  const [visible, setVisible] = useState(true);
  const idRef = React.useRef(++nextId);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <div className={styles.banner} role="alert" data-banner-id={idRef.current}>
      <span className={styles.message}>{message}</span>
      <button className={styles.closeBtn} onClick={dismiss} aria-label="Cerrar">×</button>
    </div>
  );
};

export default ErrorBanner;
