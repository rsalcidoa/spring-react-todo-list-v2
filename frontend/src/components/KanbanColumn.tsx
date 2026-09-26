import React from 'react';
import { Task } from '../services/types/task';
import KanbanCard from './KanbanCard';
import styles from './KanbanColumn.module.css';

interface KanbanColumnProps {
  status: string;
  label: string;
  tasks: Task[];
  onCardClick?: (task: Task) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDelete?: (task: Task) => void;
}

const STATUS_DOT_VAR: Record<string, string> = {
  PENDING: 'var(--color-status-pending)',
  ACTIVE: 'var(--color-status-active)',
  COMPLETED: 'var(--color-status-completed)',
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({status, label, tasks, onCardClick, onDrop, onDelete}) => {
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add(styles.dragover);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.dragover);
  };

  return (
    <div className={styles.column}>
      <h3 className={styles.header}>
        <span className={styles.dot} style={{ backgroundColor: STATUS_DOT_VAR[status] ?? 'var(--color-text-muted)' }} />
        {label} <span className={styles.count}>{tasks.length}</span>
      </h3>
      <div className={`${styles.body}`}
           onDragOver={handleDragOver}
           onDragLeave={handleDragLeave}
           onDrop={onDrop}>
        {tasks.length === 0 && <p className={styles.empty}>Sin tareas</p>}
        {tasks.map(t => (
          <KanbanCard key={t.id} task={t} onClick={() => onCardClick?.(t)} onDelete={() => onDelete?.(t)} />
        ))}
      </div>
    </div>
  );
};

export default KanbanColumn;
