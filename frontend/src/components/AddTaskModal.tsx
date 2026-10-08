import React, { useState, useEffect, useRef } from 'react';
import styles from './AddTaskModal.module.css';
import { TaskStatus, Priority, Task, Tag, Project, TaskInput, Recurrence } from '../services/types/task';
import { toDisplayMessage, type TaskRepository } from '../data/TaskRepository';
import ErrorBanner from './ErrorBanner';
import { useT } from '../i18n';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaskInput) => void;
  repository: TaskRepository;
  existingTags?: Tag[];
  projects?: Project[];
  editingTask?: Task | null;
  onTagCreated?: (tag: Tag) => void;
  onTagDeleted?: (id: number) => void;
  countTagTasks?: (id: number) => number;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({isOpen, onClose, onSave, repository, existingTags=[], projects=[], editingTask=null, onTagCreated, onTagDeleted, countTagTasks}) => {
  const { t } = useT();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(Priority.LOW);
  const [status, setStatus] = useState(TaskStatus.PENDING);
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>('NONE');
  const [projectId, setProjectId] = useState<string>('');
  const [newTagName, setNewTagName] = useState('');
  const [tagError, setTagError] = useState<{ message: string; id: number } | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
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

  useEffect(() => {
    if (isOpen && editingTask) {
      let active = true;
      repository.listSubtasks(editingTask.id)
        .then(list => { if (active) setSubtasks(list); })
        .catch(() => { if (active) setSubtasks([]); });
      return () => { active = false; };
    }
    setSubtasks([]);
    return undefined;
  }, [isOpen, editingTask, repository]);

  const handleAddSubtask = async () => {
    if (!editingTask) return;
    const title = newSubtask.trim();
    if (!title) return;
    try {
      const created = await repository.createSubtask(editingTask.id, title);
      setSubtasks(prev => [...prev, created]);
      setNewSubtask('');
    } catch (e) {
      showTagError(friendlyTagError(e));
    }
  };

  const handleDeleteSubtask = async (id: number) => {
    try {
      await repository.removeSubtask(id);
      setSubtasks(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      showTagError(friendlyTagError(e));
    }
  };

  const toggleSubtask = async (subtask: Task) => {
    const target = subtask.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
    try {
      await repository.move(subtask.id, target);
      setSubtasks(prev => prev.map(s => s.id === subtask.id ? { ...s, status: target } : s));
    } catch (e) {
      showTagError(friendlyTagError(e));
    }
  };

  const showTagError = (message: string) => {
    setTagError({ message, id: Date.now() });
  };

  const friendlyTagError = (e: unknown) => {
    const message = toDisplayMessage(e, {
      conflict: t('tagError.duplicate'),
      badRequest: t('tagError.invalid'),
      notFound: t('tagError.missing'),
    });
    return message === 'Error' ? t('tagError.invalid') : message;
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
      setReminderAt(editingTask.reminderAt ? editingTask.reminderAt.slice(0, 16) : '');
      setRecurrence((editingTask.recurrence as Recurrence) || 'NONE');
      setProjectId(editingTask.projectId != null ? String(editingTask.projectId) : '');
    } else if (isOpen && !editingTask) {
      setTitle('');
      setDescription('');
      setPriority(Priority.LOW);
      setStatus(TaskStatus.PENDING);
      setTags([]);
      setDueDate('');
      setReminderAt('');
      setRecurrence('NONE');
      setProjectId('');
      setTitleError(null);
    }
  }, [isOpen, editingTask]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!title.trim()) {
      setTitleError(t('task.titleRequired'));
      return;
    }
    setTitleError(null);
    onSave({ title, description, priority, status, tagNames: tags, dueDate, reminderAt: reminderAt || undefined, recurrence: recurrence === 'NONE' ? undefined : recurrence, projectId: projectId === '' ? undefined : Number(projectId) });
    onClose();
  };

  const toggleTag = (name: string) => {
    setTags(prev => prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]);
  };

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={editingTask ? t('task.editTitle') : t('task.newTitle')}>
        <h2 className={styles.header}>{editingTask ? t('task.editTitle') : t('task.newTitle')}</h2>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('task.title')} *</label>
          <input className={styles.input} ref={titleRef} placeholder={t('task.titlePlaceholder')} value={title} onChange={e=>setTitle(e.target.value)} />
          {titleError && <span className={styles.requiredMsg} role="alert">{titleError}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('task.description')}</label>
          <textarea className={styles.textarea} placeholder={t('task.description')} value={description} onChange={e=>setDescription(e.target.value)} />
        </div>
        <div className={`${styles.row}`}>
          <div className={styles.formGroupFlex}>
            <label className={styles.formLabel}>{t('task.priority')}</label>
            <select className={styles.select} value={priority} onChange={e=>setPriority(e.target.value as Priority)}>
              {[{v:'LOW',l:t('priority.low')},{v:'MEDIUM',l:t('priority.medium')},{v:'HIGH',l:t('priority.high')}].map(o => (<option key={o.v} value={o.v}>{o.l}</option>))}
            </select>
          </div>
          <div className={styles.formGroupFlex}>
            <label className={styles.formLabel}>{t('task.status')}</label>
            <select className={styles.select} value={status} disabled={editingTask === null} onChange={e=>setStatus(e.target.value as TaskStatus)}>
              {[{v:'PENDING',l:t('status.pending')},{v:'ACTIVE',l:t('status.active')},{v:'COMPLETED',l:t('status.completed')}].map(o => (<option key={o.v} value={o.v}>{o.l}</option>))}
            </select>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('task.dueDate')}</label>
          <input type="date" className={styles.input} value={dueDate} onChange={e=>setDueDate(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('task.reminder')}</label>
          <input type="datetime-local" className={styles.input} aria-label={t('task.reminder')} value={reminderAt} onChange={e=>setReminderAt(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('task.recurrence')}</label>
          <select className={styles.select} aria-label={t('task.recurrence')} value={recurrence} onChange={e=>setRecurrence(e.target.value as Recurrence)}>
            <option value="NONE">{t('recurrence.none')}</option>
            <option value="DAILY">{t('recurrence.daily')}</option>
            <option value="WEEKLY">{t('recurrence.weekly')}</option>
            <option value="MONTHLY">{t('recurrence.monthly')}</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('task.project')}</label>
          <select className={styles.select} aria-label="Proyecto de la tarea" value={projectId} onChange={e=>setProjectId(e.target.value)}>
            <option value="">{t('common.none')}</option>
            {projects.map(p => (<option key={p.id} value={String(p.id)}>{p.name}</option>))}
          </select>
        </div>
        <div className={styles.tagSection}>
          <span className={styles.sectionLabel}>{t('task.tags')}</span>
          <div className={styles.existingTags}>
            {existingTags.map((tag) => (
              <span key={tag.id}
                className={`${styles.tagPill} ${tags.includes(tag.name) ? styles.selected : ''}`}>
                <button type="button" onClick={()=>toggleTag(tag.name)}>{tag.name}</button>
                <button type="button" className={styles.tagDeleteBtn} aria-label={`${t('task.deleteTag')} ${tag.name}`}
                  onClick={()=>handleDeleteTag(tag.id)}>×</button>
              </span>
            ))}
          </div>
          <div className={styles.newTagRow}>
            <input className={styles.tagInput} placeholder={t('task.newTag')} value={newTagName}
              onChange={e=>setNewTagName(e.target.value)} maxLength={50} />
            <button type="button" className={styles.tagCreateBtn} onClick={handleCreateTag}>{t('common.create')}</button>
          </div>
        </div>
        {editingTask && (
          <div className={styles.tagSection}>
            <span className={styles.sectionLabel}>{t('task.subtasks')}</span>
            <ul className={styles.subtaskList}>
              {subtasks.map(s => (
                <li key={s.id} className={styles.subtaskItem}>
                  <button type="button" onClick={() => toggleSubtask(s)} aria-label={`${t('task.toggleSubtask')} ${s.title}`}>
                    {s.status === TaskStatus.COMPLETED ? '[x]' : '[ ]'}
                  </button>
                  <span>{s.title}</span>
                  <button type="button" aria-label={`${t('task.deleteSubtask')} ${s.title}`} onClick={() => handleDeleteSubtask(s.id)}>×</button>
                </li>
              ))}
            </ul>
            <div className={styles.newTagRow}>
              <input className={styles.tagInput} aria-label={t('task.newSubtask')} placeholder={t('task.newSubtask')} value={newSubtask} onChange={e => setNewSubtask(e.target.value)} />
              <button type="button" className={styles.tagCreateBtn} onClick={handleAddSubtask}>{t('common.add')}</button>
            </div>
          </div>
        )}
        {tagError && <ErrorBanner key={tagError.id} message={tagError.message} onDismiss={() => setTagError(null)} />}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>{t('common.cancel')}</button>
          <button className={styles.saveBtn} onClick={handleSubmit}>{t('common.save')}</button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
