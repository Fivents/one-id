const sameYear = (date: Date) => date.getFullYear() === new Date().getFullYear();

/** Short, scannable date-time for tables: "25 de out., 17:03" (year only when it differs). */
export function formatShortDateTime(value: Date | string, locale?: string): string {
  const date = new Date(value);
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    ...(sameYear(date) ? {} : { year: 'numeric' }),
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** "25 de out., 17:03 – 02:03" when both ends fall on the same day, otherwise both full ends. */
export function formatDateTimeRange(start: Date | string, end: Date | string, locale?: string): string {
  const from = new Date(start);
  const to = new Date(end);
  const sameDay = from.toDateString() === to.toDateString();
  const endLabel = sameDay
    ? new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(to)
    : formatShortDateTime(to, locale);
  return `${formatShortDateTime(from, locale)} – ${endLabel}`;
}
