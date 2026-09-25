import axios from 'axios';
import { TaskInput } from './types/task';

const api = axios.create({ baseURL: '/v1' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('jwt');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('jwt');
      localStorage.removeItem('email');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getTasks = () => api.get('/tasks');
export const createTask = (task: { title: string; description: string; priority: 'LOW' | 'MEDIUM' | 'HIGH'; status?: 'PENDING' | 'ACTIVE' | 'COMPLETED'; tagNames?: string[]; dueDate?: string }) => api.post('/tasks', task);
export const updateTask = (id: number, task: TaskInput) => api.put(`/tasks/${id}`, task);
export const patchStatus = (id: number, status: string) => api.patch(`/tasks/${id}/status`, { status });
export const deleteTask = (id: number) => api.delete(`/tasks/${id}`);

// Tag endpoints
export const getTags = () => api.get('/tags');
export const createTag = (name: string) => api.post('/tags', { name });
export const deleteTag = (id: number) => api.delete(`/tags/${id}`);

// export the axios instance for reuse in other modules
export { api };
