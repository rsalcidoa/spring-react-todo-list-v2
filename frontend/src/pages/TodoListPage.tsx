import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AVAILABLE_THEMES, useTheme } from '../context/ThemeContext';
import { HttpTaskRepository, type TaskRepository } from '../data/TaskRepository';
import type { BoardView, MoveDirection } from '../services/boardInteraction';
import { keyboardTarget, restoreFocus } from '../services/boardInteraction';
import { startReminderPolling, browserNotify } from '../services/reminders';
import { useT, AVAILABLE_LANGS, type TranslationKey } from '../i18n';
import { formatNumber } from '../services/format';
import { Task, TaskInput, TaskStatus, TaskSort, SortDir, Priority } from '../services/types/task';
import { useBoard } from './useBoard';
import KanbanColumn from '../components/KanbanColumn';
import AddTaskModal from '../components/AddTaskModal';
import ErrorBanner from '../components/ErrorBanner';
import UserMenu from '../components/UserMenu';
import styles from './TodoListPage.module.css';

const COLUMN_CONFIG: Record<string, { labelKey: TranslationKey; status: string }> = {
  PENDING: { labelKey: 'board.column.pending', status: 'PENDING' },
  ACTIVE: { labelKey: 'board.column.active', status: 'ACTIVE' },
  COMPLETED: { labelKey: 'board.column.completed', status: 'COMPLETED' },
};

export default function TodoListPage({ repository: repositoryProp }: { repository?: TaskRepository } = {}) {
  const { t, lang, setLang } = useT();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const repository = useMemo(() => repositoryProp ?? new HttpTaskRepository(), [repositoryProp]);

  const { tasks, grouped, tags, projects, filters, error, loading: isLoading, total, lastDeleted, actions } = useBoard(repository);
  const { view, query, tagFilter, projectFilter } = filters;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const undoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (lastDeleted) undoRef.current?.focus();
  }, [lastDeleted]);

  useEffect(() => {
    const handle = startReminderPolling(browserNotify);
    return () => handle.stop();
  }, []);

  const handleCardClick = (task: Task) => {
    const validTags = task.tags.filter(t => tags.some(x => x.id === t.id));
    setEditingTask({ ...task, tags: [...validTags] });
    setModalOpen(true);
  };

  const handleSave = (data: TaskInput) => {
    void actions.save(data, editingTask?.id ?? undefined);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t('board.deleteConfirm'))) return;
    await actions.delete(id);
  };

  const handleKeyboardMove = async (task: Task, direction: MoveDirection) => {
    const target = keyboardTarget(task.status, direction);
    if (!target) return;
    await actions.move(task.id, target);
    requestAnimationFrame(() => restoreFocus(task.id));
  };

  const countTagTasks = (id: number) => tasks.filter(t => t.tags.some(tag => tag.id === id)).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      {error && <ErrorBanner key={error.id} message={error.message} onDismiss={actions.dismissError} />}
      <span role="status" className={styles.srOnly}>{lastDeleted ? t('board.undo') : ''}</span>
      {lastDeleted && (
        <div className={styles.undoBar}>
          <span>{t('board.undo')}</span>
          <button
            ref={undoRef}
            type="button"
            className={styles.newTaskBtn}
            onClick={actions.undo}
            onFocus={actions.pauseUndoDismiss}
            onBlur={actions.resumeUndoDismiss}
          >{t('board.undoAction')}</button>
        </div>
      )}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1>{t('app.title')} <span className={styles.count}>{formatNumber(tasks.length, lang)}</span></h1>
          <div className={styles.actions}>
            <button className={styles.newTaskBtn} onClick={() => { setEditingTask(null); setModalOpen(true); }}>{t('board.newTask')}</button>
            <UserMenu email={user} onLogout={handleLogout} />
          </div>
        </div>
        <div className={styles.filters}>
          <input
            className={styles.searchInput}
            placeholder={t('board.search')}
            value={query.q ?? ''}
            onChange={e => actions.setQuery({ q: e.target.value || undefined })}
          />
          <label className={styles.themeLabel}>
            {t('board.view')}
            <select
              aria-label={t('board.view')}
              className={styles.themeSelect}
              value={view}
              onChange={e => actions.setView(e.target.value as BoardView)}
            >
              <option value="all">{t('board.view.all')}</option>
              <option value="today">{t('board.view.today')}</option>
              <option value="overdue">{t('board.view.overdue')}</option>
              <option value="upcoming">{t('board.view.upcoming')}</option>
            </select>
          </label>
          <label className={styles.themeLabel}>
            {t('board.project')}
            <select
              aria-label={t('board.filterProject')}
              className={styles.themeSelect}
              value={projectFilter}
              onChange={e => actions.setProjectFilter(e.target.value)}
            >
              <option value="">{t('board.allProjects')}</option>
              {projects.map(p => (<option key={p.id} value={String(p.id)}>{p.name}</option>))}
            </select>
          </label>
          <label className={styles.themeLabel}>
            {t('board.priority')}
            <select
              aria-label={t('board.priority')}
              className={styles.themeSelect}
              value={query.priority ?? ''}
              onChange={e => actions.setQuery({ priority: (e.target.value || undefined) as Priority | undefined })}
            >
              <option value="">{t('board.allPriorities')}</option>
              <option value={Priority.LOW}>{t('priority.low')}</option>
              <option value={Priority.MEDIUM}>{t('priority.medium')}</option>
              <option value={Priority.HIGH}>{t('priority.high')}</option>
            </select>
          </label>
          <label className={styles.themeLabel}>
            {t('board.sort')}
            <select
              aria-label={t('board.sort')}
              className={styles.themeSelect}
              value={query.sort ? `${query.sort}:${query.dir ?? 'asc'}` : 'manual'}
              onChange={e => {
                const value = e.target.value;
                if (value === 'manual') {
                  actions.setQuery({ sort: undefined, dir: undefined });
                } else {
                  const [sort, dir] = value.split(':');
                  actions.setQuery({ sort: sort as TaskSort, dir: dir as SortDir });
                }
              }}
            >
              <option value="manual">{t('board.sort.manual')}</option>
              <option value="createdAt:desc">{t('board.sort.recent')}</option>
              <option value="dueDate:asc">{t('board.sort.dueSoon')}</option>
              <option value="priority:desc">{t('board.sort.priority')}</option>
              <option value="title:asc">{t('board.sort.title')}</option>
            </select>
          </label>
          <label className={styles.themeLabel}>
            {t('board.language')}
            <select
              aria-label={t('board.language')}
              className={styles.themeSelect}
              value={lang}
              onChange={e => setLang(e.target.value)}
            >
              {AVAILABLE_LANGS.map(l => (<option key={l.code} value={l.code}>{l.label}</option>))}
            </select>
          </label>
          <label className={styles.themeLabel}>
            {t('board.theme')}
            <select
              aria-label={t('board.theme')}
              value={theme}
              onChange={e => setTheme(e.target.value as typeof theme)}
              className={styles.themeSelect}
            >
              {AVAILABLE_THEMES.map(themeOption => (
                <option key={themeOption.name} value={themeOption.name}>{t(`theme.${themeOption.name}` as TranslationKey)}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className={styles.filterRow} role="group" aria-label={t('board.filterByTag')}>
        {tags.map(tag => (
          <button
            key={tag.id}
            type="button"
            aria-pressed={tagFilter.includes(tag.id)}
            className={`${styles.filterPill} ${tagFilter.includes(tag.id) ? styles.filterActive : ''}`}
            onClick={() => actions.toggleTagFilter(tag.id)}
          >
            {tag.name}
          </button>
        ))}
        {tagFilter.length > 0 && (
          <button type="button" className={styles.filterClear} onClick={() => actions.clearTagFilter()}>
            {t('board.clear')}
          </button>
        )}
      </div>

      <main className={styles.board} aria-busy={isLoading}>
        {isLoading ? (
          <div role="status" aria-label={t('board.loading')} className={styles.skeletons}>
            {[0, 1, 2].map(i => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className={styles.emptyBoard}>
            <p>{t('board.empty')}</p>
            <button className={styles.newTaskBtn} onClick={() => { setEditingTask(null); setModalOpen(true); }}>
              {t('board.create')}
            </button>
          </div>
        ) : (
          Object.entries(COLUMN_CONFIG).map(([status, config]) => (
            <KanbanColumn
              key={status}
              status={status}
              label={t(config.labelKey)}
              tasks={grouped[status] ?? []}
              onCardClick={handleCardClick}
              onReorder={(taskId, index) => {
                void actions.reorder(taskId, status as TaskStatus, index);
                if (query.sort) actions.setQuery({ sort: undefined, dir: undefined });
              }}
              onDelete={(task) => handleDelete(task.id)}
              onQuickAdd={actions.quickAdd}
              onMove={handleKeyboardMove}
            />
          ))
        )}
      </main>

      {!isLoading && tasks.length > 0 && tasks.length < total && (
        <div style={{ padding: '0.5rem' }}>
          <button className={styles.newTaskBtn} onClick={actions.loadMore}>{t('board.more')}</button>
        </div>
      )}

      <AddTaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSave={handleSave}
        repository={repository}
        existingTags={tags}
        projects={projects}
        editingTask={editingTask}
        countTagTasks={countTagTasks}
        onTagCreated={(tag) => actions.addTag(tag)}
        onTagDeleted={(id) => { void actions.removeTag(id); }}
      />
    </div>
  );
}
