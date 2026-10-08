import React from 'react';
import { Task, TaskStatus } from '../services/types/task';
import { dropIndex, type MoveDirection } from '../services/boardInteraction';
import KanbanCard from './KanbanCard';
import QuickAddTask from './QuickAddTask';
import { useT } from '../i18n';
import { formatNumber } from '../services/format';
import styles from './KanbanColumn.module.css';

interface KanbanColumnProps {
  status: string;
  label: string;
  tasks: Task[];
  onCardClick?: (task: Task) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDelete?: (task: Task) => void;
  onQuickAdd?: (title: string, status: TaskStatus) => Promise<boolean>;
  onMove?: (task: Task, direction: MoveDirection) => void;
  onReorder?: (taskId: number, index: number) => void;
}

const STATUS_DOT_VAR: Record<string, string> = {
  PENDING: 'var(--color-status-pending)',
  ACTIVE: 'var(--color-status-active)',
  COMPLETED: 'var(--color-status-completed)',
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({status, label, tasks, onCardClick, onDrop, onDelete, onQuickAdd, onMove, onReorder}) => {
  const { t, lang } = useT();
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add(styles.dragover);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove(styles.dragover);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (onReorder) {
      const taskId = parseInt((e.dataTransfer as DataTransfer).getData('text/plain'));
      if (taskId && !isNaN(taskId)) {
        const body = e.currentTarget as HTMLElement;
        const cards = Array.from(body.querySelectorAll('[data-task]')) as HTMLElement[];
        const rects = cards.map(card => card.getBoundingClientRect());
        onReorder(taskId, dropIndex(e.clientY, rects));
      }
    }
    onDrop?.(e);
  };

  return (
    <div className={styles.column}>
      <h3 className={styles.header}>
        <span className={styles.dot} style={{ backgroundColor: STATUS_DOT_VAR[status] ?? 'var(--color-text-muted)' }} />
        {label} <span className={styles.count}>{formatNumber(tasks.length, lang)}</span>
      </h3>
      <div className={`${styles.body}`}
           onDragOver={handleDragOver}
           onDragLeave={handleDragLeave}
           onDrop={handleDrop}>
        {onQuickAdd && (
          <QuickAddTask status={status as TaskStatus} onCreate={onQuickAdd} />
        )}
        {tasks.length === 0 && <p className={styles.empty}>{t('board.columnEmpty')}</p>}
        {tasks.map(t => (
          <KanbanCard key={t.id} task={t} onClick={() => onCardClick?.(t)} onDelete={() => onDelete?.(t)} onMove={(dir) => onMove?.(t, dir)} />
        ))}
      </div>
    </div>
  );
};

export default KanbanColumn;
