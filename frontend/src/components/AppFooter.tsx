import React, { useRef, useState } from 'react';
import { useT } from '../i18n';
import ShortcutsModal from './ShortcutsModal';
import pkg from '../../package.json';
import styles from './AppFooter.module.css';

const REPO_URL = 'https://github.com/rsalcidoa/spring-react-todo-list-v2';

const AppFooter: React.FC = () => {
  const { t } = useT();
  const year = new Date().getFullYear();
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLButtonElement>(null);

  const closeHelp = () => {
    setHelpOpen(false);
    helpRef.current?.focus();
  };

  return (
    <footer className={styles.footer}>
      <span className={styles.brand}>TO-DO · v{pkg.version}</span>
      <span className={styles.hints}>{t('footer.hints')}</span>
      <span className={styles.right}>
        <button
          ref={helpRef}
          type="button"
          className={styles.helpBtn}
          aria-label={t('shortcuts.open')}
          aria-haspopup="dialog"
          aria-expanded={helpOpen}
          onClick={() => setHelpOpen(true)}
        >
          ?
        </button>
        <a className={styles.link} href={REPO_URL} target="_blank" rel="noreferrer">{t('footer.repo')}</a>
        <span className={styles.copy}>© {year} — {t('footer.rights')}</span>
      </span>
      <ShortcutsModal isOpen={helpOpen} onClose={closeHelp} />
    </footer>
  );
};

export default AppFooter;
