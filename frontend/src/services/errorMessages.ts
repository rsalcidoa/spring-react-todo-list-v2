import { presentError } from './errorPresenter';
import { useT } from '../i18n';

/**
 * Localized, taxonomy-aligned message for tag operations. Owning the
 * code -> text mapping here keeps call sites from inventing fallback strings.
 */
export function useTagErrorText(): (e: unknown) => string {
  const { t } = useT();
  return (e: unknown) => presentError(e, t, {
    fallback: t('tagError.invalid'),
    override: {
      conflict: t('tagError.duplicate'),
      'not-found': t('tagError.missing'),
    },
  });
}
