import React from 'react';
import { Task } from '../services/types/task';
import { presentTask } from '../services/taskPresentation';
import type { MoveDirection } from '../services/boardInteraction';
import styles from './KanbanCard.module.css';
import { useT } from '../i18n';

interface KanbanCardProps {
  task: Task;
  onClick?: () => void;
  onDelete?: () => void;
  onMove?: (direction: MoveDirection) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({task, onClick, onDelete, onMove}) => {
  const { t, lang } = useT();
  const view = presentTask(task, t, lang);
  const dueClass = view.dueState === 'overdue' ? styles.dueOverdue : view.dueState === 'today' ? styles.dueToday : '';

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
  <div className={`${styles.card} ${task.priority ? styles[`edge-${task.priority.toLowerCase()}`] : ''} ${view.completed ? styles.completed : ''}`}
       data-task={String(task.id)}
       tabIndex={0}
       role="button"
       aria-label={view.title}
       onKeyDown={handleKeyDown}
       onClick={(e) => { if ((e.target as HTMLElement).dataset.dragging !== 'true') onClick?.(); }}
       onDragStart={(e: React.DragEvent<HTMLDivElement>) => { (e.dataTransfer as DataTransfer).setData('text/plain', String(task.id)); }}
       draggable>
    <div className={styles.cardHeader}>
      <span className={`${styles.title} ${view.completed ? styles.completedTitle : ''}`}>{view.title}</span>
      {view.priorityLabel && task.priority && (
        <span className={`${styles.badge} ${styles[`priority-${task.priority.toLowerCase()}`]}`}>
          {view.priorityLabel}
        </span>
      )}
      {onDelete && (
        <button
          className={styles.deleteBtn}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label={view.deleteLabel}
        >
          ✕
        </button>
      )}
    </div>
    {view.recurrenceLabel && <span className={styles.recurrence}>{view.recurrenceLabel}</span>}
    {view.progressLabel && <span className={styles.progress}>{view.progressLabel}</span>}
    {task.description && <p className={styles.description}>{task.description}</p>}
    {view.dueLabel && (
      <span className={styles.meta}><span className={`${styles.dueDate} ${dueClass}`}>{view.dueLabel}</span></span>
    )}
    {view.completedLabel && <span className={styles.completedAt}>{view.completedLabel}</span>}
    <div className={styles.tagList}>
      {task.tags?.map(tag => (
        <span key={tag.id} className={styles.tag}>{tag.name}</span>
      ))}
    </div>
  </div>
  );
};

export default KanbanCard;
