import axios from 'axios';
import { TaskInput, TaskQuery } from './types/task';
import { getToken, getEmail, getRefreshToken, saveSession, saveRefreshToken, handleUnauthorized } from './session';

const api = axios.create({ baseURL: '/v1' });

api.interceptors.request.use(config => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token');
  const response = await axios.post('/v1/auth/refresh', { refreshToken });
  const token = response.data.token as string;
  saveSession(token, getEmail() ?? '');
  saveRefreshToken(response.data.refreshToken as string);
  return token;
}

api.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    const original = error?.config;
    const status = error?.response?.status;
    const url: string = original?.url ?? '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/refresh');

    if (status === 401 && !isAuthCall && original && !(original as { _retry?: boolean })._retry) {
      (original as { _retry?: boolean })._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = performRefresh().finally(() => { refreshPromise = null; });
        }
        const token = await refreshPromise;
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (refreshError) {
        handleUnauthorized(url);
        return Promise.reject(error);
      }
    }

    if (status === 401) {
      handleUnauthorized(url);
    }
    return Promise.reject(error);
  }
);

export const getTasks = (query?: TaskQuery, page?: number, size?: number) =>
  api.get('/tasks', { params: { ...query, ...(page != null ? { page } : {}), ...(size != null ? { size } : {}) } });
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
