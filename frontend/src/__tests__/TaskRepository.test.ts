import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  HttpTaskRepository,
  InMemoryTaskRepository,
  RepositoryError,
  mapApiError,
  toDisplayMessage,
  type TaskRepository,
} from '../data/TaskRepository';
import { TaskInput, Priority, TaskStatus } from '../services/types/task';
import * as ApiService from '../services/ApiService';

vi.mock('../services/ApiService', () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  patchStatus: vi.fn(),
  getTags: vi.fn(),
  createTag: vi.fn(),
  deleteTag: vi.fn(),
}));

function makeInput(overrides?: Partial<TaskInput>): TaskInput {
  return {
    title: 'Test Task',
    priority: Priority.LOW,
    status: TaskStatus.PENDING,
    tagNames: [],
    ...overrides,
  };
}

describe('TaskRepository interface semantics (InMemory)', () => {
  let repo: TaskRepository;

  beforeEach(() => {
    repo = new InMemoryTaskRepository();
  });

  it('create() stores tags with canonical first-creation case', async () => {
    const created = await repo.create(makeInput({ title: 'Tagged', tagNames: ['Work', 'Personal'] }));
    expect(created.tags.map(t => t.name)).toEqual(['Work', 'Personal']);
    expect(created.tags.every(t => typeof t.id === 'number')).toBe(true);
  });

  it('create() normalizes case-variants to the existing tag', async () => {
    await repo.create(makeInput({ title: 'T1', tagNames: ['Work'] }));
    const second = await repo.create(makeInput({ title: 'T2', tagNames: [' work '] }));
    expect(second.tags.map(t => t.name)).toEqual(['Work']);
    expect(await repo.listTags()).toHaveLength(1);
  });

  it('create() rejects blank and oversized tag names', async () => {
    await expect(repo.create(makeInput({ tagNames: [''] }))).rejects.toMatchObject({ code: 'validation' });
    await expect(repo.create(makeInput({ tagNames: ['x'.repeat(51)] }))).rejects.toMatchObject({ code: 'validation' });
    expect(await repo.fetchAll()).toHaveLength(0);
  });

  it('update() returns the updated task', async () => {
    const created = await repo.create(makeInput({ title: 'T', tagNames: ['A'] }));
    const updated = await repo.update(created.id, makeInput({ title: 'T2', status: TaskStatus.ACTIVE, tagNames: ['B'] }));
    expect(updated.title).toBe('T2');
    expect(updated.status).toBe(TaskStatus.ACTIVE);
    expect(updated.tags.map(t => t.name)).toEqual(['B']);
  });

  it('update() on missing id rejects as not-found', async () => {
    await expect(repo.update(999, makeInput())).rejects.toMatchObject({ code: 'not-found' });
  });

  it('move() transitions status and rejects on missing id', async () => {
    const created = await repo.create(makeInput({ title: 'M' }));
    await repo.move(created.id, TaskStatus.COMPLETED);
    expect((await repo.fetchAll())[0].status).toBe(TaskStatus.COMPLETED);
    await expect(repo.move(999, TaskStatus.ACTIVE)).rejects.toMatchObject({ code: 'not-found' });
  });

  it('remove() deletes and rejects on missing id', async () => {
    const created = await repo.create(makeInput({ title: 'D' }));
    await repo.remove(created.id);
    expect(await repo.fetchAll()).toHaveLength(0);
    await expect(repo.remove(created.id)).rejects.toMatchObject({ code: 'not-found' });
  });

  it('createTag() returns the real id and rejects duplicates normalized', async () => {
    const tag = await repo.createTag('Work');
    expect(typeof tag.id).toBe('number');
    await expect(repo.createTag(' work ')).rejects.toMatchObject({ code: 'conflict' });
    await expect(repo.createTag('   ')).rejects.toMatchObject({ code: 'validation' });
    expect(await repo.listTags()).toHaveLength(1);
  });

  it('deleteTag() unassigns from tasks and rejects on missing id', async () => {
    const tag = await repo.createTag('Work');
    await repo.create(makeInput({ title: 'T', tagNames: ['Work'] }));
    await repo.deleteTag(tag.id);
    expect(await repo.listTags()).toHaveLength(0);
    expect((await repo.fetchAll())[0].tags).toHaveLength(0);
    await expect(repo.deleteTag(tag.id)).rejects.toMatchObject({ code: 'not-found' });
  });

  it('full board flow without network', async () => {
    const created = await repo.create(makeInput({ title: 'Full', priority: Priority.HIGH, tagNames: ['Flow'] }));
    const updated = await repo.update(created.id, makeInput({ title: 'Upd', priority: Priority.MEDIUM, status: TaskStatus.ACTIVE, tagNames: ['Flow', 'Extra'] }));
    expect(updated.title).toBe('Upd');
    await repo.move(created.id, TaskStatus.COMPLETED);
    expect((await repo.fetchAll())[0].status).toBe(TaskStatus.COMPLETED);
    await repo.remove(created.id);
    expect(await repo.fetchAll()).toHaveLength(0);
  });
});

describe('HttpTaskRepository wire mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create() sends exact tagNames on the wire and maps the response', async () => {
    vi.mocked(ApiService.createTask).mockResolvedValueOnce({
      data: { id: 1, title: 'Tagged', priority: 'LOW', status: 'PENDING', tags: [{ id: 1, name: 'Work' }, { id: 2, name: 'Personal' }] },
    } as never);
    const repo = new HttpTaskRepository();
    const created = await repo.create(makeInput({ title: 'Tagged', tagNames: ['Work', 'Personal'] }));
    expect(ApiService.createTask).toHaveBeenCalledWith(expect.objectContaining({ tagNames: ['Work', 'Personal'] }));
    expect(created.tags.map(t => t.name)).toEqual(['Work', 'Personal']);
  });

  it('create() omits empty description and dueDate', async () => {
    vi.mocked(ApiService.createTask).mockResolvedValueOnce({ data: { id: 1, title: 'T' } } as never);
    const repo = new HttpTaskRepository();
    await repo.create(makeInput({ description: '', dueDate: '' }));
    const body = vi.mocked(ApiService.createTask).mock.calls[0][0] as unknown as Record<string, unknown>;
    expect(body).not.toHaveProperty('description');
    expect(body).not.toHaveProperty('dueDate');
  });

  it('update() returns the mapped task', async () => {
    vi.mocked(ApiService.updateTask).mockResolvedValueOnce({
      data: { id: 7, title: 'Upd', priority: 'MEDIUM', status: 'ACTIVE', tags: [] },
    } as never);
    const repo = new HttpTaskRepository();
    const updated = await repo.update(7, makeInput({ title: 'Upd' }));
    expect(updated.id).toBe(7);
    expect(updated.title).toBe('Upd');
  });

  it('move() PATCHes the status endpoint', async () => {
    vi.mocked(ApiService.patchStatus).mockResolvedValueOnce({} as never);
    const repo = new HttpTaskRepository();
    await repo.move(1, TaskStatus.COMPLETED);
    expect(ApiService.patchStatus).toHaveBeenCalledWith(1, 'COMPLETED');
  });

  it('remove() DELETEs the task endpoint', async () => {
    vi.mocked(ApiService.deleteTask).mockResolvedValueOnce({} as never);
    const repo = new HttpTaskRepository();
    await repo.remove(1);
    expect(ApiService.deleteTask).toHaveBeenCalledWith(1);
  });

  it('createTag() returns the backend tag', async () => {
    vi.mocked(ApiService.createTag).mockResolvedValueOnce({ data: { id: 42, name: 'Work' } } as never);
    const repo = new HttpTaskRepository();
    const tag = await repo.createTag('Work');
    expect(ApiService.createTag).toHaveBeenCalledWith('Work');
    expect(tag).toEqual({ id: 42, name: 'Work' });
  });

  it('failures surface as RepositoryError', async () => {
    vi.mocked(ApiService.createTag).mockRejectedValueOnce({ response: { status: 409, data: {} } });
    const repo = new HttpTaskRepository();
    const err = await repo.createTag('Work').catch(e => e);
    expect(err).toBeInstanceOf(RepositoryError);
    expect((err as RepositoryError).code).toBe('conflict');
  });
});

describe('mapApiError / toDisplayMessage', () => {
  it('maps 409/400/404 to codes and keeps the detail', () => {
    expect(mapApiError({ response: { status: 409, data: { error: 'Tag already exists' } } }).code).toBe('conflict');
    expect(mapApiError({ response: { status: 400, data: {} } }).code).toBe('validation');
    expect(mapApiError({ response: { status: 404, data: {} } }).code).toBe('not-found');
    expect(mapApiError(new Error('boom')).code).toBe('unknown');
  });

  it('toDisplayMessage prefers fallbacks, then detail', () => {
    const conflict = { response: { status: 409, data: { error: 'Tag already exists' } } };
    expect(toDisplayMessage(conflict, { conflict: 'This tag already exists' })).toBe('This tag already exists');
    expect(toDisplayMessage(conflict)).toBe('Tag already exists');
    expect(toDisplayMessage(new Error('Network down'))).toBe('Network down');
  });
});

describe('fetchAll query semantics', () => {
  it('InMemory filters by text, priority and tags, and sorts by dueDate', async () => {
    const repo = new InMemoryTaskRepository();
    const work = await repo.createTag('Work');
    await repo.create(makeInput({ title: 'Alpha', priority: Priority.LOW, dueDate: '2026-03-01' }));
    await repo.create(makeInput({ title: 'Beta informe', priority: Priority.HIGH, dueDate: '2026-01-01', tagNames: ['Work'] }));

    expect((await repo.fetchAll({ q: 'informe' })).map(t => t.title)).toEqual(['Beta informe']);
    expect((await repo.fetchAll({ priority: Priority.HIGH })).map(t => t.title)).toEqual(['Beta informe']);
    expect((await repo.fetchAll({ tagIds: [work.id] })).map(t => t.title)).toEqual(['Beta informe']);
    expect((await repo.fetchAll({ sort: 'dueDate', dir: 'asc' })).map(t => t.title)).toEqual(['Beta informe', 'Alpha']);
  });

  it('HttpTaskRepository forwards the query to ApiService', async () => {
    vi.mocked(ApiService.getTasks).mockResolvedValueOnce({ data: [] } as never);
    const repo = new HttpTaskRepository();
    await repo.fetchAll({ q: 'informe', priority: Priority.HIGH, sort: 'dueDate', dir: 'asc' });
    expect(ApiService.getTasks).toHaveBeenCalledWith(
      expect.objectContaining({ q: 'informe', priority: 'HIGH', sort: 'dueDate', dir: 'asc' }),
    );
  });
});

describe('project operations (InMemory)', () => {
  it('creates, enforces case-insensitive uniqueness, renames and deletes', async () => {
    const repo = new InMemoryTaskRepository();
    const casa = await repo.createProject('Casa');
    expect(casa.id).toBeGreaterThan(0);

    await expect(repo.createProject(' casa ')).rejects.toMatchObject({ code: 'conflict' });

    const renamed = await repo.renameProject(casa.id, 'Hogar');
    expect(renamed.name).toBe('Hogar');
    expect(await repo.listProjects()).toHaveLength(1);

    await repo.deleteProject(casa.id);
    expect(await repo.listProjects()).toHaveLength(0);
  });
});

describe('subtask operations (InMemory)', () => {
  it('lists, creates one level only, and removes subtasks', async () => {
    const repo = new InMemoryTaskRepository();
    const parent = await repo.create(makeInput({ title: 'Parent' }));
    const child = await repo.createSubtask(parent.id, 'Child');
    expect(child.parentId).toBe(parent.id);
    expect(await repo.listSubtasks(parent.id)).toHaveLength(1);
    await expect(repo.createSubtask(child.id, 'Grand')).rejects.toMatchObject({ code: 'validation' });
    await repo.removeSubtask(child.id);
    expect(await repo.listSubtasks(parent.id)).toHaveLength(0);
  });
});
