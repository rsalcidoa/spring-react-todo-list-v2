import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ShortcutsModal from '../components/ShortcutsModal';
import { I18nProvider } from '../i18n';

afterEach(cleanup);

function renderModal(props: Partial<React.ComponentProps<typeof ShortcutsModal>> = {}) {
  return render(
    <I18nProvider>
      <ShortcutsModal isOpen onClose={() => {}} {...props} />
    </I18nProvider>,
  );
}

describe('ShortcutsModal', () => {
  it('renders the dialog when open', () => {
    renderModal();
    expect(screen.getByRole('dialog', { name: /Atajos de teclado/i })).toBeTruthy();
  });

  it('does not render when closed', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('lists the supported shortcuts', () => {
    renderModal();
    expect(screen.getByText(/Enfocar una tarjeta/i)).toBeTruthy();
    expect(screen.getByText(/Editar la tarjeta enfocada/i)).toBeTruthy();
    expect(screen.getByText(/Mover la tarjeta entre columnas/i)).toBeTruthy();
    expect(screen.getByText(/Cerrar un diálogo/i)).toBeTruthy();
    expect(screen.getByText(/Crear tarea desde la columna/i)).toBeTruthy();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the overlay is clicked', () => {
    const onClose = vi.fn();
    const { container } = renderModal({ onClose });

    fireEvent.click(container.firstChild as Element);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
