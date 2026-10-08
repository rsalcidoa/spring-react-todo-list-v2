import { useEffect, useState } from 'react';
import { Task, Tag, TaskInput, Priority, TaskStatus, Recurrence } from '../services/types/task';
import { type TaskStore, type TagStore, type SubtaskStore } from '../data/TaskRepository';
import { useT } from '../i18n';
import { useTagErrorText } from '../services/errorMessages';

const EMPTY_TAGS: Tag[] = [];

export interface TaskFormArgs {
  isOpen: boolean;
  editingTask: Task | null;
  repository: TaskStore & TagStore & SubtaskStore;
  existingTags?: Tag[];
  countTagTasks?: (id: number) => number;
  onTagCreated?: (tag: Tag) => void;
  onTagDeleted?: (id: number) => void;
}

export interface TaskFormValues {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  tagNames: string[];
  dueDate: string;
  reminderAt: string;
  recurrence: Recurrence;
  projectId: string;
}

export interface TaskForm {
  values: TaskFormValues;
  newTagName: string;
  newSubtask: string;
  titleError: string | null;
  tagError: { message: string; id: number } | null;
  subtasks: Task[];
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setPriority: (value: Priority) => void;
  setStatus: (value: TaskStatus) => void;
  setDueDate: (value: string) => void;
  setReminderAt: (value: string) => void;
  setRecurrence: (value: Recurrence) => void;
  setProjectId: (value: string) => void;
  toggleTag: (name: string) => void;
  setNewTagName: (value: string) => void;
  setNewSubtask: (value: string) => void;
  createTag: () => Promise<void>;
  deleteTag: (id: number) => Promise<void>;
  addSubtask: () => Promise<void>;
  deleteSubtask: (id: number) => Promise<void>;
  toggleSubtask: (subtask: Task) => Promise<void>;
  dismissTagError: () => void;
  buildInput: () => TaskInput | null;
}

/**
 * Deep module owning the task form: field values, parsing, validation and the
 * tag/subtask sub-resources (through the repository). The modal is presentation
 * over this interface.
 */
export function useTaskForm(args: TaskFormArgs): TaskForm {
  const { isOpen, editingTask, repository, countTagTasks, onTagCreated, onTagDeleted } = args;
  const existingTags = args.existingTags ?? EMPTY_TAGS;
  const { t } = useT();
  const tagErrorText = useTagErrorText();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(Priority.LOW);
  const [status, setStatus] = useState(TaskStatus.PENDING);
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [recurrence, setRecurrence] = useState<Recurrence>('NONE');
  const [projectId, setProjectId] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [tagError, setTagError] = useState<{ message: string; id: number } | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [subtasks, setSubtasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!isOpen) return undefined;
    if (editingTask) {
      let active = true;
      repository.listSubtasks(editingTask.id)
        .then(list => { if (active) setSubtasks(list); })
        .catch(() => { if (active) setSubtasks([]); });
      return () => { active = false; };
    }
    setSubtasks([]);
    return undefined;
  }, [isOpen, editingTask, repository]);

  useEffect(() => {
    if (isOpen && editingTask) {
      setTitle(editingTask.title || '');
      setDescription(editingTask.description || '');
      setPriority((editingTask.priority as Priority) || Priority.LOW);
      setStatus((editingTask.status as TaskStatus) || TaskStatus.PENDING);
      setTags(editingTask.tags?.map(tag => tag.name) || []);
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

  useEffect(() => {
    const validNames = new Set(existingTags.map(tag => tag.name));
    setTags(prev => prev.filter(name => validNames.has(name)));
  }, [existingTags]);

  const showTagError = (e: unknown) => {
    setTagError({ message: tagErrorText(e), id: Date.now() });
  };

  const toggleTag = (name: string) => {
    setTags(prev => prev.includes(name) ? prev.filter(tag => tag !== name) : [...prev, name]);
  };

  const createTag = async () => {
    const name = newTagName.trim();
    try {
      const created = await repository.createTag(name);
      setNewTagName('');
      onTagCreated?.(created);
      setTags(prev => prev.includes(created.name) ? prev : [...prev, created.name]);
    } catch (e) {
      showTagError(e);
    }
  };

  const deleteTag = async (id: number) => {
    const deletedName = existingTags.find(tag => tag.id === id)?.name;
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
      showTagError(e);
    }
  };

  const addSubtask = async () => {
    if (!editingTask) return;
    const title = newSubtask.trim();
    if (!title) return;
    try {
      const created = await repository.createSubtask(editingTask.id, title);
      setSubtasks(prev => [...prev, created]);
      setNewSubtask('');
    } catch (e) {
      showTagError(e);
    }
  };

  const deleteSubtask = async (id: number) => {
    try {
      await repository.removeSubtask(id);
      setSubtasks(prev => prev.filter(subtask => subtask.id !== id));
    } catch (e) {
      showTagError(e);
    }
  };

  const toggleSubtask = async (subtask: Task) => {
    const target = subtask.status === TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED;
    try {
      await repository.move(subtask.id, target);
      setSubtasks(prev => prev.map(s => s.id === subtask.id ? { ...s, status: target } : s));
    } catch (e) {
      showTagError(e);
    }
  };

  const buildInput = (): TaskInput | null => {
    if (!title.trim()) {
      setTitleError(t('task.titleRequired'));
      return null;
    }
    setTitleError(null);
    return {
      title,
      description,
      priority,
      status,
      tagNames: tags,
      dueDate,
      reminderAt: reminderAt || undefined,
      recurrence: recurrence === 'NONE' ? undefined : recurrence,
      projectId: projectId === '' ? undefined : Number(projectId),
    };
  };

  const updateTitle = (value: string) => {
    setTitle(value);
    if (titleError) setTitleError(null);
  };

  return {
    values: { title, description, priority, status, tagNames: tags, dueDate, reminderAt, recurrence, projectId },
    newTagName,
    newSubtask,
    titleError,
    tagError,
    subtasks,
    setDescription,
    setPriority,
    setStatus,
    setDueDate,
    setReminderAt,
    setRecurrence,
    setProjectId,
    toggleTag,
    setNewTagName,
    setNewSubtask,
    createTag,
    deleteTag,
    addSubtask,
    deleteSubtask,
    toggleSubtask,
    dismissTagError: () => setTagError(null),
    buildInput,
    setTitle: updateTitle,
  };
}
