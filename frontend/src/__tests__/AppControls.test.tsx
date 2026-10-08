import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import AppControls from '../components/AppControls';
import { ThemeProvider } from '../context/ThemeContext';
import { I18nProvider } from '../i18n';

afterEach(cleanup);

const renderControls = () => render(
  <I18nProvider>
    <ThemeProvider>
      <AppControls />
    </ThemeProvider>
  </I18nProvider>,
);

describe('AppControls', () => {
  it('renders theme and language selectors', () => {
    renderControls();
    expect(screen.getByLabelText('Tema')).toBeTruthy();
    expect(screen.getByLabelText('Idioma')).toBeTruthy();
  });

  it('applies a theme change', () => {
    renderControls();
    fireEvent.change(screen.getByLabelText('Tema'), { target: { value: 'nord' } });
    expect(document.documentElement.getAttribute('data-theme')).toBe('nord');
  });

  it('applies a language change', () => {
    renderControls();
    fireEvent.change(screen.getByLabelText('Idioma'), { target: { value: 'en' } });
    expect(screen.getByLabelText('Theme')).toBeTruthy();
  });
});
