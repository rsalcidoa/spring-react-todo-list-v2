import { describe, it, expect } from 'vitest';
import { presentTask } from '../services/taskPresentation';
import { es, type TranslationKey } from '../i18n/es';
import { en } from '../i18n/en';
import { Task, TaskStatus, Priority } from '../services/types/task';

const tEs = (k: TranslationKey) => es[k];
const tEn = (k: TranslationKey) => en[k] ?? es[k];

const pad = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const now = new Date();
const past = new Date(now); past.setDate(now.getDate() - 1);
const future = new Date(now); future.setDate(now.getDate() + 1);

const base: Task = {
  id: 1,
  title: 'Tarea',
  priority: Priority.HIGH,
  status: TaskStatus.PENDING,
  tags: [],
};

describe('presentTask', () => {
  it('classifies and labels an overdue due date', () => {
    const p = presentTask({ ...base, dueDate: pad(past) }, tEs, 'es');
    expect(p.dueState).toBe('overdue');
    expect(p.dueLabel?.startsWith(es['board.overdue'])).toBe(true);
  });

  it('labels a task due today', () => {
    const p = presentTask({ ...base, dueDate: pad(now) }, tEs, 'es');
    expect(p.dueState).toBe('today');
    expect(p.dueLabel?.startsWith(es['board.today'])).toBe(true);
  });

  it('has no due label without a date', () => {
    const p = presentTask({ ...base }, tEs, 'es');
    expect(p.dueState).toBe('none');
    expect(p.dueLabel).toBeUndefined();
  });

  it('localizes the priority label', () => {
    expect(presentTask(base, tEs, 'es').priorityLabel).toBe(es['priority.high']);
    expect(presentTask(base, tEn, 'en').priorityLabel).toBe(en['priority.high']);
  });

  it('labels recurrence and delete in the active locale', () => {
    const p = presentTask({ ...base, recurrence: 'WEEKLY' }, tEn, 'en');
    expect(p.recurrenceLabel).toBe(en['task.recurring']);
    expect(p.deleteLabel).toBe(en['task.delete']);
    expect(presentTask({ ...base, recurrence: 'NONE' }, tEs, 'es').recurrenceLabel).toBeUndefined();
  });

  it('marks completed tasks and reports subtask progress', () => {
    const p = presentTask({ ...base, status: TaskStatus.COMPLETED, subtaskProgress: { done: 1, total: 2 } }, tEs, 'es');
    expect(p.completed).toBe(true);
    expect(p.progressLabel).toBe('1/2');
  });

  it('has no progress label without subtasks', () => {
    expect(presentTask({ ...base, subtaskProgress: { done: 0, total: 0 } }, tEs, 'es').progressLabel).toBeUndefined();
  });
});
