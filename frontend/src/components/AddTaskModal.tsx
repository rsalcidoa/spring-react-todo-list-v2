import React, { useEffect, useRef } from 'react';
import styles from './AddTaskModal.module.css';
import { TaskStatus, Priority, Task, Tag, Project, TaskInput } from '../services/types/task';
import { type TaskStore, type TagStore, type SubtaskStore } from '../data/TaskRepository';
import { useTaskForm } from './useTaskForm';
import ErrorBanner from './ErrorBanner';
import { useT } from '../i18n';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TaskInput) => void;
  repository: TaskStore & TagStore & SubtaskStore;
  existingTags?: Tag[];
  projects?: Project[];
  editingTask?: Task | null;
  onTagCreated?: (tag: Tag) => void;
  onTagDeleted?: (id: number) => void;
  countTagTasks?: (id: number) => number;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({isOpen, onClose, onSave, repository, existingTags, projects, editingTask = null, onTagCreated, onTagDeleted, countTagTasks}) => {
  const { t } = useT();
  const titleRef = useRef<HTMLInputElement>(null);
  const form = useTaskForm({ isOpen, editingTask, repository, existingTags, countTagTasks, onTagCreated, onTagDeleted });

  const tagList = existingTags ?? [];
  const projectList = projects ?? [];

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

  if (!isOpen) return null;

  const handleSubmit = () => {
    const input = form.buildInput();
    if (!input) return;
    onSave(input);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={editingTask ? t('task.editTitle') : t('task.newTitle')}>
        <h2 className={styles.header}>{editingTask ? t('task.editTitle') : t('task.newTitle')}</h2>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('task.title')} *</label>
          <input className={styles.input} ref={titleRef} placeholder={t('task.titlePlaceholder')} value={form.values.title} onChange={e=>form.setTitle(e.target.value)} />
          {form.titleError && <span className={styles.requiredMsg} role="alert">{form.titleError}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('task.description')}</label>
          <textarea className={styles.textarea} placeholder={t('task.description')} value={form.values.description} onChange={e=>form.setDescription(e.target.value)} />
        </div>
        <div className={`${styles.row}`}>
          <div className={styles.formGroupFlex}>
            <label className={styles.formLabel}>{t('task.priority')}</label>
            <select className={styles.select} value={form.values.priority} onChange={e=>form.setPriority(e.target.value as Priority)}>
              {[{v:'LOW',l:t('priority.low')},{v:'MEDIUM',l:t('priority.medium')},{v:'HIGH',l:t('priority.high')}].map(o => (<option key={o.v} value={o.v}>{o.l}</option>))}
            </select>
          </div>
          <div className={styles.formGroupFlex}>
            <label className={styles.formLabel}>{t('task.status')}</label>
            <select className={styles.select} value={form.values.status} disabled={editingTask === null} onChange={e=>form.setStatus(e.target.value as TaskStatus)}>
              {[{v:'PENDING',l:t('status.pending')},{v:'ACTIVE',l:t('status.active')},{v:'COMPLETED',l:t('status.completed')}].map(o => (<option key={o.v} value={o.v}>{o.l}</option>))}
            </select>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('task.dueDate')}</label>
          <input type="date" className={styles.input} value={form.values.dueDate} onChange={e=>form.setDueDate(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('task.reminder')}</label>
          <input type="datetime-local" className={styles.input} aria-label={t('task.reminder')} value={form.values.reminderAt} onChange={e=>form.setReminderAt(e.target.value)} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('task.recurrence')}</label>
          <select className={styles.select} aria-label={t('task.recurrence')} value={form.values.recurrence} onChange={e=>form.setRecurrence(e.target.value as typeof form.values.recurrence)}>
            <option value="NONE">{t('recurrence.none')}</option>
            <option value="DAILY">{t('recurrence.daily')}</option>
            <option value="WEEKLY">{t('recurrence.weekly')}</option>
            <option value="MONTHLY">{t('recurrence.monthly')}</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{t('task.project')}</label>
          <select className={styles.select} aria-label={t('task.projectAria')} value={form.values.projectId} onChange={e=>form.setProjectId(e.target.value)}>
            <option value="">{t('common.none')}</option>
            {projectList.map(p => (<option key={p.id} value={String(p.id)}>{p.name}</option>))}
          </select>
        </div>
        <div className={styles.tagSection}>
          <span className={styles.sectionLabel}>{t('task.tags')}</span>
          <div className={styles.existingTags}>
            {tagList.map((tag) => (
              <span key={tag.id}
                className={`${styles.tagPill} ${form.values.tagNames.includes(tag.name) ? styles.selected : ''}`}>
                <button type="button" onClick={()=>form.toggleTag(tag.name)}>{tag.name}</button>
                <button type="button" className={styles.tagDeleteBtn} aria-label={`${t('task.deleteTag')} ${tag.name}`}
                  onClick={()=>form.deleteTag(tag.id)}>×</button>
              </span>
            ))}
          </div>
          <div className={styles.newTagRow}>
            <input className={styles.tagInput} placeholder={t('task.newTag')} value={form.newTagName}
              onChange={e=>form.setNewTagName(e.target.value)} maxLength={50} />
            <button type="button" className={styles.tagCreateBtn} onClick={form.createTag}>{t('common.create')}</button>
          </div>
        </div>
        {editingTask && (
          <div className={styles.tagSection}>
            <span className={styles.sectionLabel}>{t('task.subtasks')}</span>
            <ul className={styles.subtaskList}>
              {form.subtasks.map(s => (
                <li key={s.id} className={styles.subtaskItem}>
                  <button type="button" onClick={() => form.toggleSubtask(s)} aria-label={`${t('task.toggleSubtask')} ${s.title}`}>
                    {s.status === TaskStatus.COMPLETED ? '[x]' : '[ ]'}
                  </button>
                  <span>{s.title}</span>
                  <button type="button" aria-label={`${t('task.deleteSubtask')} ${s.title}`} onClick={() => form.deleteSubtask(s.id)}>×</button>
                </li>
              ))}
            </ul>
            <div className={styles.newTagRow}>
              <input className={styles.tagInput} aria-label={t('task.newSubtask')} placeholder={t('task.newSubtask')} value={form.newSubtask} onChange={e => form.setNewSubtask(e.target.value)} />
              <button type="button" className={styles.tagCreateBtn} onClick={form.addSubtask}>{t('common.add')}</button>
            </div>
          </div>
        )}
        {form.tagError && <ErrorBanner key={form.tagError.id} message={form.tagError.message} onDismiss={form.dismissTagError} />}
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>{t('common.cancel')}</button>
          <button className={styles.saveBtn} onClick={handleSubmit}>{t('common.save')}</button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;
