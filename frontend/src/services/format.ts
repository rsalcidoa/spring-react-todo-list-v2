/** Locale-aware formatting helpers (Intl) used across the board. */

export function formatNumber(value: number, lang: string): string {
  try {
    return new Intl.NumberFormat(lang).format(value);
  } catch {
    return String(value);
  }
}

export function formatDate(iso: string | undefined | null, lang: string): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat(lang, { day: '2-digit', month: '2-digit', year: 'numeric' })
      .format(new Date(`${iso}T00:00:00`));
  } catch {
    return iso;
  }
}
