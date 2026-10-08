import React, { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';
import styles from './UserMenu.module.css';

interface UserMenuProps {
  email: string | null;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ email, onLogout }) => {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = (email ?? '?').trim().charAt(0).toUpperCase() || '?';

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={styles.userMenu} ref={ref}>
      <button
        type="button"
        className={styles.avatar}
        aria-label={t('board.userMenu')}
        aria-haspopup="menu"
        aria-expanded={open}
        title={email ?? ''}
        onClick={() => setOpen(value => !value)}
      >
        {initial}
      </button>
      {open && (
        <div className={styles.dropdown} role="menu">
          {email && <span className={styles.email}>{email}</span>}
          <button type="button" role="menuitem" className={styles.logout} onClick={onLogout}>
            {t('board.logout')}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
