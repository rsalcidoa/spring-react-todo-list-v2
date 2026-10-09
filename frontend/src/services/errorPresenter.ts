import { mapApiError, type RepositoryErrorCode } from '../data/TaskRepository';
import type { TranslationKey } from '../i18n';

/**
 * The single frontend error contract: map any thrown value to a user-facing,
 * localized message. Callers never inspect HTTP status or raw transport shapes.
 */
export type Translate = (key: TranslationKey) => string;

export interface PresentErrorOptions {
  /** Wording used when neither an override nor a detail applies. */
  fallback?: string;
  /** Per-code wording (for example a feature-specific duplicate message). */
  override?: Partial<Record<RepositoryErrorCode, string>>;
}

const CODE_KEYS: Record<RepositoryErrorCode, TranslationKey> = {
  conflict: 'error.conflict',
  unauthorized: 'error.unauthorized',
  forbidden: 'error.forbidden',
  'not-found': 'error.notFound',
  validation: 'error.validation',
  unknown: 'error.unknown',
};

export function errorCode(error: unknown): RepositoryErrorCode {
  return mapApiError(error).code;
}

export function errorDetail(error: unknown): string | undefined {
  return mapApiError(error).detail;
}

export function presentError(
  error: unknown,
  t: Translate,
  options: PresentErrorOptions = {},
): string {
  const err = mapApiError(error);
  const override = options.override?.[err.code];
  if (override) return override;
  if (err.code === 'unknown' && err.detail) return err.detail;
  if (options.fallback) return options.fallback;
  return t(CODE_KEYS[err.code]);
}
