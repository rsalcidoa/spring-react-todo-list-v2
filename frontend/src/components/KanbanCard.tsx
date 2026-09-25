import React from 'react';
import { Task } from '../services/types/task';
import styles from './KanbanCard.module.css';

interface KanbanCardProps {
  task: Task;
  onClick?: () => void;
  onDelete?: () => void;
}

const KanbanCard: React.FC<KanbanCardProps> = ({task, onClick, onDelete}) => (
  <div className={`${styles.card} ${task.priority ? styles[`priority-${task.priority.toLowerCase()}`] : ''}`}
       data-task={String(task.id)}
       onClick={(e) => { if ((e.target as HTMLElement).dataset.dragging !== 'true') onClick?.(); }}
       onDragStart={(e: React.DragEvent<HTMLDivElement>) => { (e.dataTransfer as DataTransfer).setData('text/plain', String(task.id)); }}
       draggable>
    <div className={styles.cardHeader}>
      <span className={styles.title}>{task.title}</span>
      {task.priority && (
        <span className={`${styles.badge} ${styles[`priority-${task.priority.toLowerCase()}`]}`}>
          {task.priority}
        </span>
      )}
      {onDelete && (
        <button
          className={styles.deleteBtn}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label="Delete task"
        >
          ✕
        </button>
      )}
    </div>
    {task.description && <p className={styles.description}>{task.description}</p>}
    {task.dueDate && (
      <span className={styles.meta}><span className={styles.dueDate}>{task.dueDate}</span></span>
    )}
    <div className={styles.tagList}>
      {task.tags?.map(tag => (
        <span key={tag.id} className={styles.tag}>{tag.name}</span>
      ))}
    </div>
  </div>
);

export default KanbanCard;
