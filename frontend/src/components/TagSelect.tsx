import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Tag } from '../services/types/task';
import { useT } from '../i18n';
import styles from './TagSelect.module.css';

interface TagSelectProps {
  tags: Tag[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  ariaLabel: string;
  placeholder?: string;
  maxResults?: number;
  onDeleteTag?: (tag: Tag) => void;
  collapsible?: boolean;
  showChips?: boolean;
}

/**
 * Searchable, bounded tag selector. Never renders the full tag list: the input
 * filters tags by name and only up to `maxResults` are shown.
 */
const TagSelect: React.FC<TagSelectProps> = ({
  tags,
  selectedIds,
  onChange,
  ariaLabel,
  placeholder,
  maxResults = 8,
  onDeleteTag,
  collapsible = false,
  showChips = false,
}) => {
  const { t } = useT();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(!collapsible);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!collapsible || !open) return undefined;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [collapsible, open]);

  const selected = tags.filter(tag => selectedIds.includes(tag.id));
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool = needle ? tags.filter(tag => tag.name.toLowerCase().includes(needle)) : tags;
    return pool.slice(0, maxResults);
  }, [tags, query, maxResults]);

  const toggle = (id: number) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  };

  return (
    <div className={styles.wrap} ref={ref}>
      {collapsible && (
        <button type="button" className={styles.toggle} aria-expanded={open} onClick={() => setOpen(v => !v)}>
          {ariaLabel}{selected.length > 0 ? ` (${selected.length})` : ''}
        </button>
      )}
      {showChips && selected.length > 0 && (
        <div className={styles.chips}>
          {selected.map(tag => (
            <span key={tag.id} className={styles.chip}>
              {tag.name}
              <button type="button" aria-label={`${t('board.removeTag')} ${tag.name}`} onClick={() => toggle(tag.id)}>×</button>
            </span>
          ))}
          <button type="button" className={styles.clear} onClick={() => onChange([])}>{t('board.clear')}</button>
        </div>
      )}
      {open && (
        <div className={styles.panel}>
          <input
            className={styles.input}
            aria-label={ariaLabel}
            placeholder={placeholder ?? ariaLabel}
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <ul className={styles.list} role="listbox" aria-label={ariaLabel}>
            {matches.map(tag => (
              <li key={tag.id} className={styles.item}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedIds.includes(tag.id)}
                  className={`${styles.option} ${selectedIds.includes(tag.id) ? styles.optionSelected : ''}`}
                  onClick={() => toggle(tag.id)}
                >
                  {tag.name}
                </button>
                {onDeleteTag && (
                  <button
                    type="button"
                    className={styles.delete}
                    aria-label={`${t('task.deleteTag')} ${tag.name}`}
                    onClick={() => onDeleteTag(tag)}
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TagSelect;
