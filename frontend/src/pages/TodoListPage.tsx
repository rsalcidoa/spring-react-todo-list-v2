import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HttpTaskRepository } from '../data/TaskRepository';
import { Task, Tag, TaskInput, TaskStatus } from '../services/types/task';
import KanbanColumn from '../components/KanbanColumn';
import AddTaskModal from '../components/AddTaskModal';
import styles from './TodoListPage.module.css';

const COLUMN_CONFIG: Record<string, { label: string; status: string }> = {
  PENDING: { label: 'To Do', status: 'PENDING' },
  ACTIVE: { label: 'In Progress', status: 'ACTIVE' },
  COMPLETED: { label: 'Done', status: 'COMPLETED' },
};

export default function TodoListPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const repository = new HttpTaskRepository();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTasks(); loadTags(); }, []);

  const loadTasks = async () => {
    try {
      const data = await repository.fetchAll();
      setTasks(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadTags = async () => {
    try {
      const data = await repository.listTags();
      setTags(data);
      console.log('[TodoListPage] Tags loaded:', data.length);
    } catch (e) { 
      const err = e as { response?: { status: number }; message: string };
      console.error('loadTags failed:', err.response?.status || err.message); 
    }
  };

  const handleCardClick = (task: Task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await repository.move(taskId, newStatus as TaskStatus);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t));
    } catch (e) { 
      const err = e as { response?: { status: number }; message: string; config?: { baseURL?: string; url?: string } };
      console.error('handleStatusChange failed:', err.response?.status, err.config?.url || String(err)); 
    }
  };

  const handleSave = async (data: TaskInput) => {
    if (editingTask) {
      try {
        await repository.update(editingTask.id, data);
        setTasks(prev => prev.map(t => t.id === editingTask.id
          ? { ...t, title: data.title, description: data.description, priority: data.priority, status: data.status, dueDate: data.dueDate }
          : t));
        setEditingTask(null);
        await loadTags();
      } catch (e) { console.error(e); }
    } else {
      try {
        const created = await repository.create(data);
        setTasks(prev => [...prev, created]);
        await loadTags();
      } catch (e) { console.error(e); }
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Eliminar esta tarea?')) return;
    try {
      await repository.remove(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e) { console.error(e); }
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
        existingTags={tags}
        editingTask={editingTask}
      />
    </div>
  );
}
