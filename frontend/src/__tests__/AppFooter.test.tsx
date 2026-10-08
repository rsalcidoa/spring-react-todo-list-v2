import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import AppFooter from '../components/AppFooter';
import pkg from '../../package.json';

afterEach(cleanup);

describe('AppFooter', () => {
  it('renders the version, keyboard hints, repo link and copyright', () => {
    render(<AppFooter />);

    expect(screen.getByText(new RegExp(`v${pkg.version}`))).toBeTruthy();
    expect(screen.getByText(/mover|move/i)).toBeTruthy();

    const link = screen.getByRole('link', { name: /Repositorio|Repository/i });
    expect(link.getAttribute('href')).toBe('https://github.com/rsalcidoa/spring-react-todo-list-v2');

    expect(screen.getByText(/derechos reservados|all rights reserved/i)).toBeTruthy();
  });
});
