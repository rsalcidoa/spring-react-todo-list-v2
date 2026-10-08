import { toDisplayMessage } from '../data/TaskRepository';
import { useT } from '../i18n';

/**
 * Localized, taxonomy-aligned message for tag operations. Owning the
 * code -> text mapping here keeps call sites from inventing fallback strings.
 */
export function useTagErrorText(): (e: unknown) => string {
  const { t } = useT();
  return (e: unknown) => {
    const message = toDisplayMessage(e, {
      conflict: t('tagError.duplicate'),
      badRequest: t('tagError.invalid'),
      notFound: t('tagError.missing'),
    });
    return message === 'Error' ? t('tagError.invalid') : message;
  };
}
