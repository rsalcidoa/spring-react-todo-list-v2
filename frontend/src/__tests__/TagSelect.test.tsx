import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TagSelect from '../components/TagSelect';

afterEach(cleanup);

const tags = [
  { id: 1, name: 'Work' },
  { id: 2, name: 'Personal' },
  { id: 3, name: 'Urgent' },
];

describe('TagSelect', () => {
  it('filters tags case-insensitively and caps the results', () => {
    render(<TagSelect tags={tags} selectedIds={[]} onChange={() => {}} ariaLabel="tags" maxResults={2} />);

    expect(screen.getAllByRole('option')).toHaveLength(2);

    fireEvent.change(screen.getByRole('textbox', { name: 'tags' }), { target: { value: 'per' } });

    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByRole('option', { name: 'Personal' })).toBeTruthy();
  });

  it('toggles tags on click', () => {
    const onChange = vi.fn();
    render(<TagSelect tags={tags} selectedIds={[1]} onChange={onChange} ariaLabel="tags" />);

    fireEvent.click(screen.getByRole('option', { name: 'Personal' }));
    expect(onChange).toHaveBeenCalledWith([1, 2]);

    fireEvent.click(screen.getByRole('option', { name: 'Work' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('keeps the options hidden until opened when collapsible, and shows chips', () => {
    render(<TagSelect tags={tags} selectedIds={[1]} onChange={() => {}} ariaLabel="Filtrar" collapsible showChips />);

    expect(screen.queryByRole('option')).toBeNull();
    expect(screen.getByText('Work')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Filtrar/i }));
    expect(screen.getByRole('option', { name: 'Personal' })).toBeTruthy();
  });
});
