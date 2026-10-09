import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import KanbanCard from '../components/KanbanCard';
import { I18nProvider } from '../i18n';
import { Task, TaskStatus, Priority } from '../services/types/task';

afterEach(cleanup);

const task: Task = {
  id: 1,
  title: 'Write report',
  priority: Priority.HIGH,
  status: TaskStatus.PENDING,
  tags: [],
  recurrence: 'WEEKLY',
  subtaskProgress: { done: 1, total: 2 },
};

function renderCard(overrides: Partial<Task> = {}, props: { onDelete?: () => void } = {}) {
  return render(
    <I18nProvider>
      <KanbanCard task={{ ...task, ...overrides }} {...props} />
    </I18nProvider>,
  );
}

describe('KanbanCard', () => {
  it('renders the localized priority, recurrence and delete labels', () => {
    renderCard({}, { onDelete: () => {} });
    expect(screen.getByText('Alta')).toBeTruthy();
    expect(screen.getByText('Se repite')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Borrar tarea' })).toBeTruthy();
  });

  it('shows subtask progress', () => {
    renderCard();
    expect(screen.getByText('1/2')).toBeTruthy();
  });

  it('marks a completed card', () => {
    renderCard({ status: TaskStatus.COMPLETED });
    const card = screen.getByText('Write report').closest('[data-task]') as HTMLElement;
    expect(card.className).toMatch(/completed/);
  });

  it('shows the completion date for a completed task', () => {
    renderCard({ status: TaskStatus.COMPLETED, completedAt: '2026-10-08T20:30:00' });
    expect(screen.getByText(/Completada/)).toBeTruthy();
  });

  it('shows both the overdue chip and the completion date', () => {
    renderCard({ status: TaskStatus.COMPLETED, dueDate: '2020-01-01', completedAt: '2026-10-08T20:30:00' });
    expect(screen.getByText(/Vencida/)).toBeTruthy();
    expect(screen.getByText(/Completada/)).toBeTruthy();
  });

  it('exposes the title as the accessible name', () => {
    renderCard();
    expect(screen.getByRole('button', { name: 'Write report' })).toBeTruthy();
  });
});
