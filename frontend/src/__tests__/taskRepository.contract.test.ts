import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  InMemoryTaskRepository,
  HttpTaskRepository,
  RepositoryError,
  type TaskRepository,
} from '../data/TaskRepository';
import * as ApiService from '../services/ApiService';
import { Priority, TaskStatus, type TaskInput } from '../services/types/task';

vi.mock('../services/ApiService', () => ({
  getTasks: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), deleteTask: vi.fn(), patchStatus: vi.fn(),
  getTags: vi.fn(), createTag: vi.fn(), deleteTag: vi.fn(), getProjects: vi.fn(), createProject: vi.fn(),
  renameProject: vi.fn(), deleteProject: vi.fn(), getSubtasks: vi.fn(), reorderPosition: vi.fn(), restoreTask: vi.fn(),
}));

function input(title: string, overrides: Partial<TaskInput> = {}): TaskInput {
  return { title, priority: Priority.LOW, status: TaskStatus.PENDING, tagNames: [], ...overrides };
}

function wireInput(body: any): TaskInput {
  return {
    title: body.title,
    description: body.description,
    priority: body.priority,
    status: body.status,
    dueDate: body.dueDate,
    reminderAt: body.reminderAt,
    recurrence: body.recurrence,
    projectId: body.projectId,
    parentId: body.parentId,
    tagNames: Array.isArray(body.tagNames) ? body.tagNames : [],
  };
}

/**
 * An HttpTaskRepository wired to a mocked ApiService that emulates the backend
 * contract (ownership/nesting rules included), so the same cases can run over
 * both adapters.
 */
function httpBackedBy(backend: InMemoryTaskRepository): TaskRepository {
  const m = ApiService as unknown as Record<string, ReturnType<typeof vi.fn>>;

  m.getTasks.mockImplementation(async (query?: any, page?: number, size?: number) => ({
    data: page != null && size != null ? await backend.fetchPage(query, page, size) : await backend.fetchAll(query),
  }));
  m.createTask.mockImplementation(async (body: any) => {
    if (body?.parentId != null) {
      const all = await backend.fetchAll();
      const parent = all.find(t => t.id === body.parentId);
      if (!parent) throw new RepositoryError('validation', `Parent ${body.parentId} not found`);
      if (parent.parentId != null) throw new RepositoryError('validation', 'Subtasks cannot be nested');
    }
    return { data: await backend.create(wireInput(body)) };
  });
  m.updateTask.mockImplementation(async (id: number, body: any) => ({ data: await backend.update(id, wireInput(body)) }));
  m.patchStatus.mockImplementation(async (id: number, status: any) => { await backend.move(id, status); return {}; });
  m.deleteTask.mockImplementation(async (id: number) => { await backend.remove(id); return {}; });
  m.restoreTask.mockImplementation(async (id: number) => ({ data: await backend.restore(id) }));
  m.reorderPosition.mockImplementation(async (id: number, status: any, position: number) => { await backend.reorder(id, status, position); return {}; });
  m.getSubtasks.mockImplementation(async (parentId: number) => ({ data: await backend.listSubtasks(parentId) }));
  m.getTags.mockImplementation(async () => ({ data: await backend.listTags() }));
  m.createTag.mockImplementation(async (name: string) => ({ data: await backend.createTag(name) }));
  m.deleteTag.mockImplementation(async (id: number) => { await backend.deleteTag(id); return {}; });
  m.getProjects.mockImplementation(async () => ({ data: await backend.listProjects() }));
  m.createProject.mockImplementation(async (name: string) => ({ data: await backend.createProject(name) }));
  m.renameProject.mockImplementation(async (id: number, name: string) => ({ data: await backend.renameProject(id, name) }));
  m.deleteProject.mockImplementation(async (id: number) => { await backend.deleteProject(id); return {}; });

  return new HttpTaskRepository();
}

const adapters: Array<[string, () => TaskRepository]> = [
  ['InMemoryTaskRepository', () => new InMemoryTaskRepository()],
  ['HttpTaskRepository (mocked backend)', () => httpBackedBy(new InMemoryTaskRepository())],
];

describe.each(adapters)('TaskRepository contract: %s', (_label, makeRepo) => {
  let repo: TaskRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = makeRepo();
  });

  it('trims tag names and rejects blank and case-insensitive duplicates', async () => {
    const tag = await repo.createTag('  Work  ');
    expect(tag.name).toBe('Work');
    expect(typeof tag.id).toBe('number');

    await expect(repo.createTag(' work ')).rejects.toMatchObject({ code: 'conflict' });
    await expect(repo.createTag('   ')).rejects.toMatchObject({ code: 'validation' });
    expect(await repo.listTags()).toHaveLength(1);
  });

  it('assigns existing tags case-insensitively and unassigns on delete', async () => {
    const tag = await repo.createTag('Work');
    const task = await repo.create(input('Tagged', { tagNames: ['work'] }));
    expect(task.tags).toEqual([{ id: tag.id, name: 'Work' }]);

    await repo.deleteTag(tag.id);
    expect((await repo.fetchAll())[0].tags).toHaveLength(0);
  });

  it('enforces one-level subtasks and validates the parent', async () => {
    const parent = await repo.create(input('Parent'));
    const child = await repo.createSubtask(parent.id, 'Child');
    expect(child.parentId).toBe(parent.id);
    expect(await repo.listSubtasks(parent.id)).toHaveLength(1);

    await expect(repo.createSubtask(child.id, 'Grand')).rejects.toMatchObject({ code: 'validation' });
    await expect(repo.createSubtask(9999, 'Orphan')).rejects.toMatchObject({ code: 'validation' });
    await expect(repo.create(input('Nested', { parentId: child.id }))).rejects.toMatchObject({ code: 'validation' });
  });

  it('rejects operations on a missing task as not-found', async () => {
    await expect(repo.update(9999, input('x'))).rejects.toMatchObject({ code: 'not-found' });
    await expect(repo.move(9999, TaskStatus.ACTIVE)).rejects.toMatchObject({ code: 'not-found' });
    await expect(repo.remove(9999)).rejects.toMatchObject({ code: 'not-found' });
    await expect(repo.restore(9999)).rejects.toMatchObject({ code: 'not-found' });
    await expect(repo.listSubtasks(9999)).rejects.toMatchObject({ code: 'not-found' });
  });

  it('pages with the same items/page/size/total envelope', async () => {
    for (let i = 0; i < 5; i++) await repo.create(input('T' + i));

    const first = await repo.fetchPage(undefined, 0, 2);
    expect(first.items).toHaveLength(2);
    expect(first).toMatchObject({ page: 0, size: 2, total: 5 });

    const last = await repo.fetchPage(undefined, 2, 2);
    expect(last.items).toHaveLength(1);
  });

  it('restores a soft-deleted task', async () => {
    const task = await repo.create(input('Recover'));
    await repo.remove(task.id);
    expect(await repo.fetchAll()).toHaveLength(0);

    const restored = await repo.restore(task.id);
    expect(restored.id).toBe(task.id);
    expect(await repo.fetchAll()).toHaveLength(1);
  });

  it('creates, renames and deletes projects with case-insensitive uniqueness', async () => {
    const project = await repo.createProject('Casa');
    await expect(repo.createProject(' casa ')).rejects.toMatchObject({ code: 'conflict' });

    const renamed = await repo.renameProject(project.id, 'Hogar');
    expect(renamed.name).toBe('Hogar');

    await repo.deleteProject(project.id);
    expect(await repo.listProjects()).toHaveLength(0);
  });
});
