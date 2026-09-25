import React, { useState, useEffect } from 'react';
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
}

const TAG_ERROR_FALLBACKS = {
  conflict: 'This tag already exists',
  badRequest: 'Tag name is invalid',
  notFound: 'This tag no longer exists',
};

const AddTaskModal: React.FC<AddTaskModalProps> = ({isOpen, onClose, onSave, repository, existingTags=[], editingTask=null, onTagCreated, onTagDeleted}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(Priority.LOW);
  const [status, setStatus] = useState(TaskStatus.PENDING);
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [tagError, setTagError] = useState<{ message: string; id: number } | null>(null);

  const showTagError = (message: string) => {
    setTagError({ message, id: Date.now() });
  };

  const friendlyTagError = (e: unknown) => {
    const message = toDisplayMessage(e, TAG_ERROR_FALLBACKS);
    return message === 'Error' ? 'Something went wrong' : message;
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
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
    }
  }, [isOpen, editingTask]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSave({ title, description, priority, status, tagNames: tags, dueDate });
    onClose();
  };

  const toggleTag = (name: string) => {
    setTags(prev => prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]);
  };

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <h2 className={styles.header}>{editingTask ? 'Edit Task' : 'Add Task'}</h2>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Title *</label>
          <input className={styles.input} placeholder="Enter task title" value={title} onChange={e=>setTitle(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Description</label>
          <textarea className={styles.textarea} placeholder="Description" value={description} onChange={e=>setDescription(e.target.value)} />
        </div>
        <div className={`${styles.row}`}>
          <div className={styles.formGroupFlex}>
            <label className={styles.formLabel}>Priority</label>
            <select className={styles.select} value={priority} onChange={e=>setPriority(e.target.value as Priority)}>
              {['LOW','MEDIUM','HIGH'].map(p => (<option key={p} value={p}>{p}</option>))}
            </select>
          </div>
          <div className={styles.formGroupFlex}>
            <label className={styles.formLabel}>Status</label>
            <select className={styles.select} value={status} disabled={editingTask === null} onChange={e=>setStatus(e.target.value as TaskStatus)}>
              {['PENDING','ACTIVE','COMPLETED'].map(s => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Due Date</label>
          <input type="date" className={styles.input} value={dueDate} onChange={e=>setDueDate(e.target.value)} />
        </div>
        <div className={styles.tagSection}>
          <span className={styles.sectionLabel}>Tags:</span>
          <div className={styles.existingTags}>
            {existingTags.map((tag) => (
              <span key={tag.id}
                className={`${styles.tagPill} ${tags.includes(tag.name) ? styles.selected : ''}`}>
                <button type="button" onClick={()=>toggleTag(tag.name)}>{tag.name}</button>
                <button type="button" className={styles.tagDeleteBtn} aria-label={`Delete tag ${tag.name}`}
                  onClick={()=>handleDeleteTag(tag.id)}>×</button>
              </span>
            ))}
          </div>
          <div className={styles.newTagRow}>
            <input className={styles.tagInput} placeholder="New tag name" value={newTagName}
              onChange={e=>setNewTagName(e.target.value)} maxLength={50} />
            <button type="button" className={styles.tagCreateBtn} onClick={handleCreateTag}>Create</button>
          </div>
        </div>
        {tagError && <ErrorBanner key={tagError.id} message={tagError.message} onDismiss={() => setTagError(null)} />}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
