import { Task, Priority, TaskStatus } from './types/task';
import { getDueState, type DueState } from './boardQuery';
import { formatDate } from './format';
import type { TranslationKey } from '../i18n';

/**
 * How a Task presents: completed treatment, Priority, Due state and label,
 * Recurrence and the delete label, all localized. The card is a view over this.
 */
export type Translate = (key: TranslationKey) => string;

export interface TaskPresentation {
  completed: boolean;
  title: string;
  priorityLabel?: string;
  dueState: DueState;
  dueLabel?: string;
  recurrenceLabel?: string;
  deleteLabel: string;
  progressLabel?: string;
  completedLabel?: string;
}

const PRIORITY_KEYS: Record<Priority, TranslationKey> = {
  [Priority.LOW]: 'priority.low',
  [Priority.MEDIUM]: 'priority.medium',
  [Priority.HIGH]: 'priority.high',
};

export function presentTask(task: Task, t: Translate, lang: string): TaskPresentation {
  const completed = task.status === TaskStatus.COMPLETED;
  const dueState = getDueState(task.dueDate);
  const dueLabel = !task.dueDate
    ? undefined
    : dueState === 'overdue'
      ? `${t('board.overdue')}: ${formatDate(task.dueDate, lang)}`
      : dueState === 'today'
        ? `${t('board.today')}: ${formatDate(task.dueDate, lang)}`
        : formatDate(task.dueDate, lang);

  return {
    completed,
    title: task.title,
    priorityLabel: task.priority ? t(PRIORITY_KEYS[task.priority]) : undefined,
    dueState,
    dueLabel,
    recurrenceLabel: task.recurrence && task.recurrence !== 'NONE' ? t('task.recurring') : undefined,
    deleteLabel: t('task.delete'),
    progressLabel: task.subtaskProgress && task.subtaskProgress.total > 0
      ? `${task.subtaskProgress.done}/${task.subtaskProgress.total}`
      : undefined,
    completedLabel: completed && task.completedAt
      ? `${t('task.completedOn')}: ${formatDate(task.completedAt.slice(0, 10), lang)}`
      : undefined,
  };
}
