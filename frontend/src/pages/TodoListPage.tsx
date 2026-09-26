import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AVAILABLE_THEMES, useTheme } from '../context/ThemeContext';
import { HttpTaskRepository, toDisplayMessage, type TaskRepository } from '../data/TaskRepository';
import { Task, Tag, TaskInput, TaskStatus } from '../services/types/task';
import KanbanColumn from '../components/KanbanColumn';
import AddTaskModal from '../components/AddTaskModal';
import ErrorBanner from '../components/ErrorBanner';
import styles from './TodoListPage.module.css';

const COLUMN_CONFIG: Record<string, { label: string; status: string }> = {
  PENDING: { label: 'Por hacer', status: 'PENDING' },
  ACTIVE: { label: 'En progreso', status: 'ACTIVE' },
  COMPLETED: { label: 'Hecho', status: 'COMPLETED' },
};

export default function TodoListPage({ repository: repositoryProp }: { repository?: TaskRepository } = {}) {
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const repository = useMemo(() => repositoryProp ?? new HttpTaskRepository(), [repositoryProp]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState<number[]>([]);
  const [error, setError] = useState<{ message: string; id: number } | null>(null);

  useEffect(() => { loadTasks(); loadTags(); }, []);

  const showError = (message: string) => {
    setError({ message, id: Date.now() });
  };

  const dismissError = () => {
    setError(null);
  };

  const showTransientError = (message: string) => {
    showError(message);
    window.setTimeout(() => {
      setError(prev => (prev && prev.message === message ? null : prev));
    }, 5000);
  };

  const errorMessage = (e: unknown) => toDisplayMessage(e);

  const loadTasks = async () => {
    try {
      const data = await repository.fetchAll();
      setTasks(data);
    } catch (e) { showTransientError(errorMessage(e)); }
    finally { setLoading(false); }
  };

  const loadTags = async (): Promise<Tag[] | null> => {
    try {
      const data = await repository.listTags();
      setTags(data);
      return data;
    } catch (e) {
      showTransientError(errorMessage(e));
      return null;
    } finally {
      setTagsLoading(false);
    }
  };

  const handleCardClick = (task: Task) => {
    const validTags = task.tags.filter(t => tags.some(x => x.id === t.id));
    setEditingTask({ ...task, tags: [...validTags] });
    setModalOpen(true);
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    const previous = tasks.find(t => t.id === taskId)?.status;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t));
    try {
      await repository.move(taskId, newStatus as TaskStatus);
    } catch (e) {
      if (previous !== undefined) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: previous } : t));
      }
      showTransientError(`No se pudo mover: ${errorMessage(e)}`);
    }
  };

  const handleSave = async (data: TaskInput) => {
    if (editingTask) {
      try {
        const saved = await repository.update(editingTask.id, data);
        setTasks(prev => prev.map(t => t.id === editingTask.id ? saved : t));
        setEditingTask(null);
        await loadTags();
      } catch (e) { showTransientError(errorMessage(e)); }
    } else {
      try {
        const created = await repository.create(data);
        setTasks(prev => [...prev, created]);
        await loadTags();
      } catch (e) { showTransientError(errorMessage(e)); }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Eliminar esta tarea?')) return;
    try {
      await repository.remove(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) { showTransientError(errorMessage(e)); }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, status: string) => {
    e.preventDefault();
    if (e.currentTarget.classList.contains('dragover')) {
      e.currentTarget.classList.remove('dragover');
    }
    const taskIdStr = (e.dataTransfer as DataTransfer).getData('text/plain');
    const taskId = parseInt(taskIdStr);
    if (!taskId || isNaN(taskId)) return;

    const task = tasks.find(t => t.id === taskId);
    if (task && String(task.status) !== status) {
      await handleStatusChange(taskId, status);
    }
  };

  const visibleTasks = tagFilter.length === 0
    ? tasks
    : tasks.filter(t => t.tags.some(tag => tagFilter.includes(tag.id)));

  const grouped = visibleTasks.reduce((acc, task) => {
    const status = task.status || 'PENDING';
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const toggleTagFilter = (id: number) => {
    setTagFilter(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const countTagTasks = (id: number) => tasks.filter(t => t.tags.some(tag => tag.id === id)).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isLoading = loading || tagsLoading;

  return (
    <div className={styles.page}>
      {error && <ErrorBanner key={error.id} message={error.message} onDismiss={dismissError} />}
      <header className={styles.header}>
        <h1>Tablero <span className={styles.count}>{tasks.length}</span></h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label className={styles.themeLabel}>
            Tema
            <select
              aria-label="Tema"
              value={theme}
              onChange={e => setTheme(e.target.value as typeof theme)}
              className={styles.themeSelect}
            >
              {AVAILABLE_THEMES.map(t => (
                <option key={t.name} value={t.name}>{t.label}</option>
              ))}
            </select>
          </label>
          <button className={styles.newTaskBtn} onClick={() => { setEditingTask(null); setModalOpen(true); }}>+ Tarea</button>
          <button className={styles.logoutBtn} onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>

      <div className={styles.filterRow} role="group" aria-label="Filtrar por etiqueta">
        {tags.map(tag => (
          <button
            key={tag.id}
            type="button"
            aria-pressed={tagFilter.includes(tag.id)}
            className={`${styles.filterPill} ${tagFilter.includes(tag.id) ? styles.filterActive : ''}`}
            onClick={() => toggleTagFilter(tag.id)}
          >
            {tag.name}
          </button>
        ))}
        {tagFilter.length > 0 && (
          <button type="button" className={styles.filterClear} onClick={() => setTagFilter([])}>
            Limpiar
          </button>
        )}
      </div>

      <main className={styles.board}>
        {isLoading ? (
          <div role="status" aria-label="Cargando tareas" className={styles.skeletons}>
            {[0, 1, 2].map(i => <div key={i} className={styles.skeleton} />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className={styles.emptyBoard}>
            <p>No hay tareas todavía</p>
            <button className={styles.newTaskBtn} onClick={() => { setEditingTask(null); setModalOpen(true); }}>
              Crear tarea
            </button>
          </div>
        ) : (
          Object.entries(COLUMN_CONFIG).map(([status, config]) => (
            <KanbanColumn
              key={status}
              status={status}
              label={config.label}
              tasks={grouped[status] ?? []}
              onCardClick={handleCardClick}
              onDrop={(e) => handleDrop(e, status)}
              onDelete={(task) => handleDelete(task.id)}
            />
          ))
        )}
      </main>

      <AddTaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSave={handleSave}
        repository={repository}
        existingTags={tags}
        editingTask={editingTask}
        countTagTasks={countTagTasks}
        onTagCreated={(tag) => setTags(prev => [...prev, tag])}
        onTagDeleted={(id) => {
          setTags(prev => prev.filter(t => t.id !== id));
          setTasks(prev => prev.map(t => ({ ...t, tags: t.tags.filter(tag => tag.id !== id) })));
        }}
      />
    </div>
  );
}
