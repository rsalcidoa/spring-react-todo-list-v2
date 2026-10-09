import { describe, it, expect } from 'vitest';
import { presentError, errorCode, errorDetail } from '../services/errorPresenter';
import { es, type TranslationKey } from '../i18n/es';
import { en } from '../i18n/en';

const tEs = (k: TranslationKey) => es[k];
const tEn = (k: TranslationKey) => en[k] ?? es[k];

const conflict = { response: { status: 409, data: { error: 'Tag already exists' } } };
const validationNoDetail = { response: { status: 400, data: {} } };

describe('errorPresenter', () => {
  it('uses the localized default for a coded error', () => {
    expect(presentError(conflict, tEs)).toBe(es['error.conflict']);
  });

  it('lets a per-code override win over the default', () => {
    expect(presentError(conflict, tEs, { override: { conflict: 'This tag already exists' } }))
      .toBe('This tag already exists');
  });

  it('surfaces the detail of an unmapped error', () => {
    expect(presentError(new Error('Network down'), tEs)).toBe('Network down');
  });

  it('never yields a bare Error sentinel', () => {
    const message = presentError(conflict, tEs);
    expect(message).toBe(es['error.conflict']);
    expect(message).not.toBe('Error');
  });

  it('uses the fallback before the localized default', () => {
    expect(presentError(validationNoDetail, tEs, { fallback: 'bad request' })).toBe('bad request');
  });

  it('localizes the message for the active locale', () => {
    expect(presentError(conflict, tEn)).toBe(en['error.conflict']);
  });

  it('exposes the code and the underlying detail', () => {
    expect(errorCode(conflict)).toBe('conflict');
    expect(errorDetail(conflict)).toBe('Tag already exists');
    expect(errorDetail(validationNoDetail)).toBeUndefined();
  });
});
