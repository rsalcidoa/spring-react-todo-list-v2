import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HttpTaskRepository, toDisplayMessage, type TaskRepository } from '../data/TaskRepository';
import { Task, Tag, TaskInput, TaskStatus } from '../services/types/task';
import KanbanColumn from '../components/KanbanColumn';
import AddTaskModal from '../components/AddTaskModal';
import ErrorBanner from '../components/ErrorBanner';
import styles from './TodoListPage.module.css';

const COLUMN_CONFIG: Record<string, { label: string; status: string }> = {
  PENDING: { label: 'To Do', status: 'PENDING' },
  ACTIVE: { label: 'In Progress', status: 'ACTIVE' },
  COMPLETED: { label: 'Done', status: 'COMPLETED' },
};

export default function TodoListPage({ repository: repositoryProp }: { repository?: TaskRepository } = {}) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const repository = useMemo(() => repositoryProp ?? new HttpTaskRepository(), [repositoryProp]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
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
      showTransientError(errorMessage(e));
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

  const grouped = tasks.reduce((acc, task) => {
    const status = task.status || 'PENDING';
    if (!acc[status]) acc[status] = [];
    acc[status].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.page}>
      {error && <ErrorBanner key={error.id} message={error.message} onDismiss={dismissError} />}
      <header className={styles.header}>
        <h1>Task Board</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className={styles.newTaskBtn} onClick={() => { setEditingTask(null); setModalOpen(true); }}>+ Task</button>
          <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className={styles.board}>
        {Object.entries(COLUMN_CONFIG).map(([status, config]) => (
          <KanbanColumn
            key={status}
            status={status}
            label={config.label}
            tasks={grouped[status] ?? []}
            onCardClick={handleCardClick}
            onDrop={(e) => handleDrop(e, status)}
            onDelete={(task) => handleDelete(task.id)}
          />
        ))}
      </main>

      <AddTaskModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingTask(null); }}
        onSave={handleSave}
        repository={repository}
        existingTags={tags}
        editingTask={editingTask}
        onTagCreated={(tag) => setTags(prev => [...prev, tag])}
        onTagDeleted={(id) => {
          setTags(prev => prev.filter(t => t.id !== id));
          setTasks(prev => prev.map(t => ({ ...t, tags: t.tags.filter(tag => tag.id !== id) })));
        }}
      />
    </div>
  );
}
