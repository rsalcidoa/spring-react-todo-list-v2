import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import ManageProjectsModal from '../components/ManageProjectsModal';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const projects = [
  { id: 1, name: 'Casa', description: 'Remodelación de la cocina' },
  { id: 2, name: 'Trabajo' },
];

function renderModal(overrides: Partial<React.ComponentProps<typeof ManageProjectsModal>> = {}) {
  return render(
    <ManageProjectsModal
      isOpen
      onClose={() => {}}
      projects={projects}
      onCreate={vi.fn().mockResolvedValue(undefined)}
      onRename={vi.fn().mockResolvedValue(undefined)}
      onDelete={vi.fn().mockResolvedValue(undefined)}
      {...overrides}
    />,
  );
}

describe('ManageProjectsModal', () => {
  it('lists projects with their description', () => {
    renderModal();
    expect(screen.getByText('Casa')).toBeTruthy();
    expect(screen.getByText('Remodelación de la cocina')).toBeTruthy();
  });

  it('creates a project with name and description', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    renderModal({ onCreate });

    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Casa' } });
    fireEvent.change(screen.getByLabelText(/Descripción/i), { target: { value: 'Cocina' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear proyecto/i }));

    await waitFor(() => expect(onCreate).toHaveBeenCalledWith('Casa', 'Cocina'));
  });

  it('edits a project', async () => {
    const onRename = vi.fn().mockResolvedValue(undefined);
    renderModal({ onRename });

    fireEvent.click(screen.getAllByRole('button', { name: /Editar/i })[0]);
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'Hogar' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

    await waitFor(() => expect(onRename).toHaveBeenCalledWith(1, 'Hogar', 'Remodelación de la cocina'));
  });

  it('deletes a project after confirmation', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderModal({ onDelete });

    fireEvent.click(screen.getAllByRole('button', { name: /Borrar/i })[0]);

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(1));
  });
});
