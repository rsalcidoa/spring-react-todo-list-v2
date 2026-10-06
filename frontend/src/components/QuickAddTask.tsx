import React, { useState } from 'react';
import { TaskStatus } from '../services/types/task';
import { useT } from '../i18n';
import styles from './QuickAddTask.module.css';

interface QuickAddTaskProps {
  status: TaskStatus;
  onCreate: (title: string, status: TaskStatus) => Promise<boolean>;
}

const QuickAddTask: React.FC<QuickAddTaskProps> = ({ status, onCreate }) => {
  const { t } = useT();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = value.trim();
    if (!title) {
      setError(t('quickAdd.required'));
      return;
    }
    setError(null);
    const created = await onCreate(title, status);
    if (created) setValue('');
  };

  return (
    <form className={styles.quickAdd} onSubmit={submit}>
      <input
        className={styles.input}
        placeholder={t('quickAdd.placeholder')}
        aria-label={t('quickAdd.placeholder')}
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button type="submit" className={styles.addBtn} aria-label={t('quickAdd.add')}>+</button>
      {error && <span className={styles.error} role="alert">{error}</span>}
    </form>
  );
};

export default QuickAddTask;
