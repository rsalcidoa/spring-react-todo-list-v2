import React, { useState } from 'react';
import { TaskStatus } from '../services/types/task';
import styles from './QuickAddTask.module.css';

interface QuickAddTaskProps {
  status: TaskStatus;
  onCreate: (title: string, status: TaskStatus) => Promise<boolean>;
}

const QuickAddTask: React.FC<QuickAddTaskProps> = ({ status, onCreate }) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = value.trim();
    if (!title) {
      setError('El título es obligatorio');
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
        placeholder="Añadir tarea"
        aria-label="Añadir tarea"
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button type="submit" className={styles.addBtn} aria-label="Añadir">+</button>
      {error && <span className={styles.error} role="alert">{error}</span>}
    </form>
  );
};

export default QuickAddTask;
