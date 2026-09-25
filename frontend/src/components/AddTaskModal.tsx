import React, { useState, useEffect } from 'react';
import styles from './AddTaskModal.module.css';
import { TaskStatus, Priority, Task, Tag, TaskInput } from '../services/types/task';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaskInput) => void;
  existingTags?: Tag[];
  editingTask?: Task | null;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({isOpen, onClose, onSave, existingTags=[], editingTask=null}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(Priority.LOW);
  const [status, setStatus] = useState(TaskStatus.PENDING);
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');

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
            <select className={styles.select} value={status} onChange={e=>setStatus(e.target.value as TaskStatus)}>
              {['PENDING','ACTIVE','COMPLETED'].map(s => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Due Date</label>
          <input type="date" className={styles.input} value={dueDate} onChange={e=>setDueDate(e.target.value)} />
        </div>
        {existingTags && existingTags.length > 0 && (
          <div className={styles.tagSection}>
            <span className={styles.sectionLabel}>Tags:</span>
            <div className={styles.existingTags}>
              {existingTags.map((tag) => (
                <button key={tag.id} onClick={()=>toggleTag(tag.name)}
                  className={`${styles.tagPill} ${tags.includes(tag.name) ? styles.selected : ''}`}>
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
