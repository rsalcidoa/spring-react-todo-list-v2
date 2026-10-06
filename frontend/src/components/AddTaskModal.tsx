import React, { useState, useEffect, useRef } from 'react';
import styles from './AddTaskModal.module.css';
import { TaskStatus, Priority, Task, Tag, TaskInput } from '../services/types/task';
import { toDisplayMessage, type TaskRepository } from '../data/TaskRepository';
import ErrorBanner from './ErrorBanner';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaskInput) => void;
  repository: TaskRepository;
  existingTags?: Tag[];
  editingTask?: Task | null;
  onTagCreated?: (tag: Tag) => void;
  onTagDeleted?: (id: number) => void;
  countTagTasks?: (id: number) => number;
}

const TAG_ERROR_FALLBACKS = {
  conflict: 'Esta etiqueta ya existe',
  badRequest: 'Nombre de etiqueta inválido',
  notFound: 'La etiqueta ya no existe',
};

const AddTaskModal: React.FC<AddTaskModalProps> = ({isOpen, onClose, onSave, repository, existingTags=[], editingTask=null, onTagCreated, onTagDeleted, countTagTasks}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(Priority.LOW);
  const [status, setStatus] = useState(TaskStatus.PENDING);
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [tagError, setTagError] = useState<{ message: string; id: number } | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) titleRef.current?.focus();
  }, [isOpen]);

  const showTagError = (message: string) => {
    setTagError({ message, id: Date.now() });
  };

  const friendlyTagError = (e: unknown) => {
    const message = toDisplayMessage(e, TAG_ERROR_FALLBACKS);
    return message === 'Error' ? 'Algo salió mal' : message;
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    try {
      const created = await repository.createTag(name);
      setNewTagName('');
      onTagCreated?.(created);
      setTags(prev => prev.includes(created.name) ? prev : [...prev, created.name]);
    } catch (e) {
      showTagError(friendlyTagError(e));
    }
  };

  const handleDeleteTag = async (id: number) => {
    const deletedName = existingTags.find(t => t.id === id)?.name;
    if (!deletedName) return;
    const usage = countTagTasks?.(id) ?? 0;
    if (usage > 0 && !window.confirm(`"${deletedName}" está en ${usage} tarea(s). ¿Borrarla?`)) return;
    const wasSelected = tags.includes(deletedName);
    if (wasSelected) {
      setTags(prev => prev.filter(name => name !== deletedName));
    }
    try {
      await repository.deleteTag(id);
      onTagDeleted?.(id);
    } catch (e) {
      if (wasSelected) {
        setTags(prev => prev.includes(deletedName) ? prev : [...prev, deletedName]);
      }
      showTagError(friendlyTagError(e));
    }
  };

  useEffect(() => {
    const validNames = new Set(existingTags.map(t => t.name));
    setTags(prev => prev.filter(name => validNames.has(name)));
  }, [existingTags]);

  useEffect(() => {
    if (isOpen && editingTask) {
      setTitle(editingTask.title || '');
      setDescription(editingTask.description || '');
      setPriority((editingTask.priority as Priority) || Priority.LOW);
      setStatus((editingTask.status as TaskStatus) || TaskStatus.PENDING);
      setTags(editingTask.tags?.map(t => t.name) || []);
      setDueDate(editingTask.dueDate || '');
    } else if (isOpen && !editingTask) {
      setTitle('');
      setDescription('');
      setPriority(Priority.LOW);
      setStatus(TaskStatus.PENDING);
      setTags([]);
      setDueDate('');
      setTitleError(null);
    }
  }, [isOpen, editingTask]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!title.trim()) {
      setTitleError('El título es obligatorio');
      return;
    }
    setTitleError(null);
    onSave({ title, description, priority, status, tagNames: tags, dueDate });
    onClose();
  };

  const toggleTag = (name: string) => {
    setTags(prev => prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]);
  };

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={editingTask ? 'Editar tarea' : 'Nueva tarea'}>
        <h2 className={styles.header}>{editingTask ? 'Editar tarea' : 'Nueva tarea'}</h2>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Título *</label>
          <input className={styles.input} ref={titleRef} placeholder="Título de la tarea" value={title} onChange={e=>setTitle(e.target.value)} />
          {titleError && <span className={styles.requiredMsg} role="alert">{titleError}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Descripción</label>
          <textarea className={styles.textarea} placeholder="Descripción" value={description} onChange={e=>setDescription(e.target.value)} />
        </div>
        <div className={`${styles.row}`}>
          <div className={styles.formGroupFlex}>
            <label className={styles.formLabel}>Prioridad</label>
            <select className={styles.select} value={priority} onChange={e=>setPriority(e.target.value as Priority)}>
              {[{v:'LOW',l:'Baja'},{v:'MEDIUM',l:'Media'},{v:'HIGH',l:'Alta'}].map(o => (<option key={o.v} value={o.v}>{o.l}</option>))}
            </select>
          </div>
          <div className={styles.formGroupFlex}>
            <label className={styles.formLabel}>Estado</label>
            <select className={styles.select} value={status} disabled={editingTask === null} onChange={e=>setStatus(e.target.value as TaskStatus)}>
              {[{v:'PENDING',l:'Pendiente'},{v:'ACTIVE',l:'En progreso'},{v:'COMPLETED',l:'Completada'}].map(o => (<option key={o.v} value={o.v}>{o.l}</option>))}
            </select>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Vencimiento</label>
          <input type="date" className={styles.input} value={dueDate} onChange={e=>setDueDate(e.target.value)} />
        </div>
        <div className={styles.tagSection}>
          <span className={styles.sectionLabel}>Etiquetas:</span>
          <div className={styles.existingTags}>
            {existingTags.map((tag) => (
              <span key={tag.id}
                className={`${styles.tagPill} ${tags.includes(tag.name) ? styles.selected : ''}`}>
                <button type="button" onClick={()=>toggleTag(tag.name)}>{tag.name}</button>
                <button type="button" className={styles.tagDeleteBtn} aria-label={`Borrar etiqueta ${tag.name}`}
                  onClick={()=>handleDeleteTag(tag.id)}>×</button>
              </span>
            ))}
          </div>
          <div className={styles.newTagRow}>
            <input className={styles.tagInput} placeholder="Nueva etiqueta" value={newTagName}
              onChange={e=>setNewTagName(e.target.value)} maxLength={50} />
            <button type="button" className={styles.tagCreateBtn} onClick={handleCreateTag}>Crear</button>
          </div>
        </div>
        {tagError && <ErrorBanner key={tagError.id} message={tagError.message} onDismiss={() => setTagError(null)} />}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button className={styles.saveBtn} onClick={handleSubmit}>Guardar</button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
