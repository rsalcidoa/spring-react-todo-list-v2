import React, { useEffect, useRef } from 'react';
import { useT, type TranslationKey } from '../i18n';
import styles from './ShortcutsModal.module.css';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS: Array<{ keys: string; labelKey: TranslationKey }> = [
  { keys: 'Tab', labelKey: 'shortcuts.focus' },
  { keys: 'Enter', labelKey: 'shortcuts.edit' },
  { keys: 'Alt + ← / →', labelKey: 'shortcuts.move' },
  { keys: 'Esc', labelKey: 'shortcuts.close' },
  { keys: 'Enter', labelKey: 'shortcuts.quickAdd' },
];

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useT();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) dialogRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={t('shortcuts.title')}
        ref={dialogRef}
        tabIndex={-1}
      >
        <h2 className={styles.header}>{t('shortcuts.title')}</h2>
        <ul className={styles.list}>
          {SHORTCUTS.map(shortcut => (
            <li key={shortcut.labelKey} className={styles.item}>
              <span className={styles.label}>{t(shortcut.labelKey)}</span>
              <kbd className={styles.keys}>{shortcut.keys}</kbd>
            </li>
          ))}
        </ul>
        <div className={styles.actions}>
          <button type="button" className={styles.closeBtn} onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;
