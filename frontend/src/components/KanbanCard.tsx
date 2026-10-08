import React from 'react';
import { Task, Priority, TaskStatus } from '../services/types/task';
import { getDueState, type MoveDirection } from '../services/boardInteraction';
import styles from './KanbanCard.module.css';
import { useT } from '../i18n';
import { formatDate } from '../services/format';

const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.LOW]: 'Baja',
  [Priority.MEDIUM]: 'Media',
  [Priority.HIGH]: 'Alta',
};

interface KanbanCardProps {
  task: Task;
  onClick?: () => void;
  onDelete?: () => void;
  onMove?: (direction: MoveDirection) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({task, onClick, onDelete, onMove}) => {
  const { t, lang } = useT();
  const completed = task.status === TaskStatus.COMPLETED;
  const dueState = getDueState(task.dueDate);
  const dueClass = dueState === 'overdue' ? styles.dueOverdue : dueState === 'today' ? styles.dueToday : '';
  const dueLabel =
    dueState === 'overdue' ? `${t('board.overdue')}: ${formatDate(task.dueDate, lang)}` :
    dueState === 'today' ? `${t('board.today')}: ${formatDate(task.dueDate, lang)}` :
    task.dueDate ? formatDate(task.dueDate, lang) : undefined;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onClick?.();
      return;
    }
    if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      onMove?.(e.key === 'ArrowRight' ? 'right' : 'left');
    }
  };

  return (
  <div className={`${styles.card} ${task.priority ? styles[`edge-${task.priority.toLowerCase()}`] : ''} ${completed ? styles.completed : ''}`}
       data-task={String(task.id)}
       tabIndex={0}
       role="button"
       aria-label={task.title}
       onKeyDown={handleKeyDown}
       onClick={(e) => { if ((e.target as HTMLElement).dataset.dragging !== 'true') onClick?.(); }}
       onDragStart={(e: React.DragEvent<HTMLDivElement>) => { (e.dataTransfer as DataTransfer).setData('text/plain', String(task.id)); }}
       draggable>
    <div className={styles.cardHeader}>
      <span className={`${styles.title} ${completed ? styles.completedTitle : ''}`}>{task.title}</span>
      {task.priority && (
        <span className={`${styles.badge} ${styles[`priority-${task.priority.toLowerCase()}`]}`}>
          {PRIORITY_LABELS[task.priority] ?? task.priority}
        </span>
      )}
      {onDelete && (
        <button
          className={styles.deleteBtn}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label="Borrar tarea"
        >
          ✕
        </button>
      )}
    </div>
    {task.recurrence && task.recurrence !== 'NONE' && (
      <span className={styles.recurrence}>Se repite</span>
    )}
    {task.subtaskProgress && task.subtaskProgress.total > 0 && (
      <span className={styles.progress}>{task.subtaskProgress.done}/{task.subtaskProgress.total}</span>
    )}
    {task.description && <p className={styles.description}>{task.description}</p>}
    {task.dueDate && (
      <span className={styles.meta}><span className={`${styles.dueDate} ${dueClass}`}>{dueLabel}</span></span>
    )}
    <div className={styles.tagList}>
      {task.tags?.map(tag => (
        <span key={tag.id} className={styles.tag}>{tag.name}</span>
      ))}
    </div>
  </div>
  );
};

export default KanbanCard;
