import { describe, it, expect } from 'vitest';
import { HttpTaskRepository, InMemoryTaskRepository, TaskRepository } from '../data/TaskRepository';
import type { ApiClient } from '../data/TaskRepository';
import { TaskInput, Task, Tag, Priority, TaskStatus } from '../services/types/task';

interface RecordedRequest {
  method: string;
  url: string;
  body?: unknown;
}

function makeRecordingClient(): { client: ApiClient; requests: RecordedRequest[] } {
  const requests: RecordedRequest[] = [];
  const tasks: Task[] = [];
  const tags: Tag[] = [];
  let nextId = 1;

  const client: ApiClient = {
    async getTasks() {
      requests.push({ method: 'GET', url: '/tasks' });
      return { data: [...tasks] };
    },
    async createTask(body) {
      requests.push({ method: 'POST', url: '/tasks', body });
      const task: Task = {
        id: nextId++,
        title: body.title,
        description: body.description,
        priority: body.priority,
        status: (body.status as TaskStatus) ?? TaskStatus.PENDING,
        dueDate: body.dueDate,
        tags: (body.tagNames ?? []).map((name, i) => ({ id: i + 1, name })),
      };
      tasks.push(task);
      return { data: task };
    },
    async updateTask(id, body) {
      requests.push({ method: 'PUT', url: `/tasks/${id}`, body });
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) {
        tasks[idx] = {
          ...tasks[idx],
          title: body.title,
          description: body.description,
          priority: body.priority,
          status: (body.status as TaskStatus) ?? tasks[idx].status,
          dueDate: body.dueDate,
          tags: (body.tagNames ?? []).map((name, i) => ({ id: i + 1, name })),
        };
      }
    },
    async deleteTask(id) {
      requests.push({ method: 'DELETE', url: `/tasks/${id}` });
      const idx = tasks.findIndex(t => t.id === id);
      if (idx !== -1) tasks.splice(idx, 1);
    },
    async patchStatus(id, status) {
      requests.push({ method: 'PATCH', url: `/tasks/${id}/status`, body: { status } });
      const task = tasks.find(t => t.id === id);
      if (task) task.status = status as TaskStatus;
    },
    async getTags() {
      requests.push({ method: 'GET', url: '/tags' });
      return { data: [...tags] };
    },
  };

  return { client, requests };
}

function makeInput(overrides?: Partial<TaskInput>): TaskInput {
  return {
    title: 'Test Task',
    priority: Priority.LOW,
    status: TaskStatus.PENDING,
    tagNames: [],
    ...overrides,
  };
}

function runSharedSuite(name: string, factory: () => TaskRepository) {
  describe(name, () => {
    it('create() with tagNames produces wire request with exact tagNames', async () => {
      const repo = factory();
      if (repo instanceof HttpTaskRepository) {
        const { client, requests } = makeRecordingClient();
        const httpRepo = new HttpTaskRepository(client);
        await httpRepo.create(makeInput({ title: 'Tagged', tagNames: ['Work', 'Personal'] }));
        const createReq = requests.find(r => r.method === 'POST' && r.url === '/tasks');
        expect(createReq).toBeDefined();
        expect(createReq!.body).toMatchObject({ tagNames: ['Work', 'Personal'] });
      } else {
        const inMem = repo as InMemoryTaskRepository;
        await inMem.create(makeInput({ title: 'Tagged', tagNames: ['Work', 'Personal'] }));
        const tasks = await inMem.fetchAll();
        expect(tasks).toHaveLength(1);
        expect(tasks[0].tags.map(t => t.name)).toEqual(['Work', 'Personal']);
      }
    });

    it('create() with empty dueDate omits dueDate from wire body', async () => {
      const repo = factory();
      if (repo instanceof HttpTaskRepository) {
        const { client, requests } = makeRecordingClient();
        const httpRepo = new HttpTaskRepository(client);
        await httpRepo.create(makeInput({ dueDate: '' }));
        const createReq = requests.find(r => r.method === 'POST' && r.url === '/tasks');
        expect(createReq).toBeDefined();
        expect(createReq!.body).not.toHaveProperty('dueDate');
      } else {
        const inMem = repo as InMemoryTaskRepository;
        await inMem.create(makeInput({ dueDate: '' }));
        const tasks = await inMem.fetchAll();
        expect(tasks[0].dueDate ?? null).toBeFalsy();
      }
    });

    it('fetchAll() maps wire responses to domain Task with tags array', async () => {
      const repo = factory();
      if (repo instanceof HttpTaskRepository) {
        const { client, requests } = makeRecordingClient();
        const httpRepo = new HttpTaskRepository(client);
        await httpRepo.create(makeInput({ title: 'Wire Task', tagNames: ['A', 'B'] }));
        const all = await httpRepo.fetchAll();
        expect(all).toHaveLength(1);
        expect(Array.isArray(all[0].tags)).toBe(true);
        expect(all[0].tags).toHaveLength(2);
      } else {
        const inMem = repo as InMemoryTaskRepository;
        await inMem.create(makeInput({ title: 'Wire Task', tagNames: ['A', 'B'] }));
        const all = await inMem.fetchAll();
        expect(all).toHaveLength(1);
        expect(Array.isArray(all[0].tags)).toBe(true);
        expect(all[0].tags.map(t => t.name)).toEqual(['A', 'B']);
      }
    });

    it('move() transitions task status', async () => {
      const repo = factory();
      if (repo instanceof HttpTaskRepository) {
        const { client, requests } = makeRecordingClient();
        const httpRepo = new HttpTaskRepository(client);
        await httpRepo.create(makeInput({ title: 'Move Me' }));
        await httpRepo.move(1, TaskStatus.COMPLETED);
        const patchReq = requests.find(r => r.method === 'PATCH');
        expect(patchReq).toBeDefined();
        expect(patchReq!.url).toBe('/tasks/1/status');
        expect(patchReq!.body).toEqual({ status: 'COMPLETED' });
      } else {
        const inMem = repo as InMemoryTaskRepository;
        await inMem.create(makeInput({ title: 'Move Me' }));
        await inMem.move(1, TaskStatus.COMPLETED);
        const tasks = await inMem.fetchAll();
        expect(tasks[0].status).toBe(TaskStatus.COMPLETED);
      }
    });

    it('remove() deletes a task', async () => {
      const repo = factory();
      if (repo instanceof HttpTaskRepository) {
        const { client, requests } = makeRecordingClient();
        const httpRepo = new HttpTaskRepository(client);
        await httpRepo.create(makeInput({ title: 'Delete Me' }));
        await httpRepo.remove(1);
        const delReq = requests.find(r => r.method === 'DELETE');
        expect(delReq).toBeDefined();
        expect(delReq!.url).toBe('/tasks/1');
      } else {
        const inMem = repo as InMemoryTaskRepository;
        await inMem.create(makeInput({ title: 'Delete Me' }));
        await inMem.remove(1);
        const tasks = await inMem.fetchAll();
        expect(tasks).toHaveLength(0);
      }
    });

    it('listTags() returns registered tags', async () => {
      const repo = factory();
      if (repo instanceof HttpTaskRepository) {
        const { client, requests } = makeRecordingClient();
        const httpRepo = new HttpTaskRepository(client);
        await httpRepo.create(makeInput({ tagNames: ['X'] }));
        const tags = await httpRepo.listTags();
        expect(Array.isArray(tags)).toBe(true);
      } else {
        const inMem = repo as InMemoryTaskRepository;
        await inMem.create(makeInput({ tagNames: ['X', 'Y'] }));
        const tags = await inMem.listTags();
        expect(tags.map(t => t.name).sort()).toEqual(['X', 'Y']);
      }
    });

    it('full board flow: fetchAll, create, update, move, remove, listTags', async () => {
      const repo = factory();
      const created = await repo.create(makeInput({ title: 'Full Flow', priority: Priority.HIGH, tagNames: ['Flow'] }));
      expect(created.id).toBeDefined();

      await repo.update(created.id, makeInput({ title: 'Updated Flow', priority: Priority.MEDIUM, status: TaskStatus.ACTIVE, tagNames: ['Flow', 'Extra'] }));

      const afterUpdate = await repo.fetchAll();
      expect(afterUpdate).toHaveLength(1);
      expect(afterUpdate[0].title).toBe('Updated Flow');
      expect(afterUpdate[0].priority).toBe(Priority.MEDIUM);
      expect(afterUpdate[0].status).toBe(TaskStatus.ACTIVE);

      await repo.move(created.id, TaskStatus.COMPLETED);
      const afterMove = await repo.fetchAll();
      expect(afterMove[0].status).toBe(TaskStatus.COMPLETED);

      await repo.remove(created.id);
      const final = await repo.fetchAll();
      expect(final).toHaveLength(0);
    });
  });
}

runSharedSuite('InMemoryTaskRepository', () => new InMemoryTaskRepository());
runSharedSuite('HttpTaskRepository (with recording client)', () => {
  const { client } = makeRecordingClient();
  return new HttpTaskRepository(client);
});

describe('toWire / fromWire helpers', () => {
  it('toWire omits empty description and dueDate', async () => {
    const { toWire } = await import('../data/TaskRepository');
    const wire = toWire(makeInput({ title: 'T', description: '', dueDate: '' }));
    expect(wire).not.toHaveProperty('description');
    expect(wire).not.toHaveProperty('dueDate');
  });

  it('toWire preserves non-empty description and dueDate', async () => {
    const { toWire } = await import('../data/TaskRepository');
    const wire = toWire(makeInput({ title: 'T', description: 'desc', dueDate: '2026-01-01' }));
    expect(wire.description).toBe('desc');
    expect(wire.dueDate).toBe('2026-01-01');
  });

  it('fromWire defaults tags to empty array', async () => {
    const { fromWire } = await import('../data/TaskRepository');
    const task = fromWire({ id: 1, title: 'T' });
    expect(task.tags).toEqual([]);
  });

  it('fromWire defaults status to PENDING', async () => {
    const { fromWire } = await import('../data/TaskRepository');
    const task = fromWire({ id: 1, title: 'T' });
    expect(task.status).toBe(TaskStatus.PENDING);
  });
});
