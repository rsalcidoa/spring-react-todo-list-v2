import React, { useEffect, useState } from 'react';
import { Project } from '../services/types/task';
import { presentError } from '../services/errorPresenter';
import ErrorBanner from './ErrorBanner';
import { useT } from '../i18n';
import styles from './ManageProjectsModal.module.css';

interface ManageProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onCreate: (name: string, description?: string) => Promise<void>;
  onRename: (id: number, name: string, description?: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const ManageProjectsModal: React.FC<ManageProjectsModalProps> = ({ isOpen, onClose, projects, onCreate, onRename, onDelete }) => {
  const { t } = useT();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; id: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) { setName(''); setDescription(''); setEditingId(null); setError(null); }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => { setName(''); setDescription(''); setEditingId(null); setNameError(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(t('project.nameRequired'));
      return;
    }
    setNameError(null);
    try {
      if (editingId != null) {
        await onRename(editingId, name, description || undefined);
      } else {
        await onCreate(name, description || undefined);
      }
      resetForm();
    } catch (err) {
      setError({ message: presentError(err, t), id: Date.now() });
    }
  };

  const startEdit = (project: Project) => {
    setEditingId(project.id);
    setName(project.name);
    setDescription(project.description ?? '');
    setNameError(null);
  };

  const remove = async (project: Project) => {
    if (!window.confirm(t('project.deleteConfirm'))) return;
    try {
      await onDelete(project.id);
      if (editingId === project.id) resetForm();
    } catch (err) {
      setError({ message: presentError(err, t), id: Date.now() });
    }
  };

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={t('project.manage')}>
        <h2 className={styles.header}>{t('project.manage')}</h2>
        {error && <ErrorBanner key={error.id} message={error.message} onDismiss={() => setError(null)} />}
        <form className={styles.form} onSubmit={submit}>
          <label className={styles.label}>
            {t('project.name')}
            <input className={styles.input} value={name}
              onChange={e => { setName(e.target.value); if (nameError) setNameError(null); }} maxLength={50} />
            {nameError && <span className={styles.requiredMsg} role="alert">{nameError}</span>}
          </label>
          <label className={styles.label}>
            {t('project.description')}
            <textarea className={styles.textarea} value={description} onChange={e => setDescription(e.target.value)} maxLength={500} />
          </label>
          <div className={styles.formActions}>
            {editingId != null && (
              <button type="button" className={styles.cancelBtn} onClick={resetForm}>{t('common.cancel')}</button>
            )}
            <button type="submit" className={styles.primaryBtn}>
              {editingId != null ? t('project.save') : t('project.create')}
            </button>
          </div>
        </form>
        <ul className={styles.list}>
          {projects.length === 0 && <li className={styles.empty}>{t('project.empty')}</li>}
          {projects.map(project => (
            <li key={project.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <span className={styles.itemName}>{project.name}</span>
                {project.description && <span className={styles.itemDescription}>{project.description}</span>}
              </div>
              <button type="button" className={styles.itemBtn} onClick={() => startEdit(project)}>{t('project.edit')}</button>
              <button type="button" className={styles.itemBtn} onClick={() => remove(project)}>{t('project.delete')}</button>
            </li>
          ))}
        </ul>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>{t('common.close')}</button>
        </div>
      </div>
    </div>
  );
};

export default ManageProjectsModal;
