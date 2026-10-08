import React from 'react';
import { AVAILABLE_THEMES, readTheme, useOptionalTheme } from '../context/ThemeContext';
import { useT, AVAILABLE_LANGS, type TranslationKey } from '../i18n';
import styles from './AppControls.module.css';

/** Theme + language selectors for the pre-auth screens (shared preferences). */
const AppControls: React.FC = () => {
  const themeCtx = useOptionalTheme();
  const theme = themeCtx?.theme ?? readTheme();
  const setTheme = themeCtx?.setTheme ?? (() => {});
  const { t, lang, setLang } = useT();

  return (
    <div className={styles.controls}>
      <select
        aria-label={t('board.theme')}
        className={styles.select}
        value={theme}
        onChange={e => setTheme(e.target.value as typeof theme)}
      >
        {AVAILABLE_THEMES.map(option => (
          <option key={option.name} value={option.name}>{t(`theme.${option.name}` as TranslationKey)}</option>
        ))}
      </select>
      <select
        aria-label={t('board.language')}
        className={styles.select}
        value={lang}
        onChange={e => setLang(e.target.value)}
      >
        {AVAILABLE_LANGS.map(l => (<option key={l.code} value={l.code}>{l.label}</option>))}
      </select>
    </div>
  );
};

export default AppControls;
