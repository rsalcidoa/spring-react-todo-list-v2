import React from 'react';
import { useT } from '../i18n';
import pkg from '../../package.json';
import styles from './AppFooter.module.css';

const REPO_URL = 'https://github.com/rsalcidoa/spring-react-todo-list-v2';

const AppFooter: React.FC = () => {
  const { t } = useT();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <span className={styles.brand}>TO-DO · v{pkg.version}</span>
      <span className={styles.hints}>{t('footer.hints')}</span>
      <span className={styles.right}>
        <a className={styles.link} href={REPO_URL} target="_blank" rel="noreferrer">{t('footer.repo')}</a>
        <span className={styles.copy}>© {year} — {t('footer.rights')}</span>
      </span>
    </footer>
  );
};

export default AppFooter;
