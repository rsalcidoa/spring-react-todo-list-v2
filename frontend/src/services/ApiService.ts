import axios from 'axios';
import { TaskInput, TaskQuery } from './types/task';
import { getToken, handleUnauthorized } from './session';

const api = axios.create({ baseURL: '/v1' });

api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error?.response?.status === 401) {
      handleUnauthorized(error.config?.url);
    }
    return Promise.reject(error);
  }
);

export const getTasks = (query?: TaskQuery) => api.get('/tasks', { params: query });
export const createTask = (task: TaskInput) => api.post('/tasks', task);
export const updateTask = (id: number, task: TaskInput) => api.put(`/tasks/${id}`, task);
export const patchStatus = (id: number, status: string) => api.patch(`/tasks/${id}/status`, { status });
export const deleteTask = (id: number) => api.delete(`/tasks/${id}`);
export const getDueReminders = () => api.get('/tasks/reminders');
export const ackReminder = (id: number) => api.post(`/tasks/${id}/reminder-ack`);
export const getSubtasks = (parentId: number) => api.get(`/tasks/${parentId}/subtasks`);
export const reorderPosition = (id: number, status: string, position: number) => api.patch(`/tasks/${id}/position`, { status, position });
export const restoreTask = (id: number) => api.post(`/tasks/${id}/restore`);

// Tag endpoints
export const getTags = () => api.get('/tags');
export const createTag = (name: string) => api.post('/tags', { name });
export const deleteTag = (id: number) => api.delete(`/tags/${id}`);

// Project endpoints
export const getProjects = () => api.get('/projects');
export const createProject = (name: string) => api.post('/projects', { name });
export const renameProject = (id: number, name: string) => api.put(`/projects/${id}`, { name });
export const deleteProject = (id: number) => api.delete(`/projects/${id}`);

// Password reset endpoints
export const requestReset = (email: string) => api.post('/auth/reset-request', { email });
export const verifyResetToken = (token: string) => api.post('/auth/reset-verify', { token });
export const changePasswordReset = (token: string, newPassword: string) => api.put('/auth/reset-change', { token, newPassword, confirmPassword: newPassword });

// export the axios instance for reuse in other modules
export { api };
