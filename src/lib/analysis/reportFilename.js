/**
 * Safe filename slug from a display name.
 * @param {unknown} name
 */
export function slugifyReportName(name) {
  const slug = String(name || 'user')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  return slug || 'user';
}

/**
 * @param {string} userName
 * @param {Date | string} [when]
 */
export function buildPersonalAnalyticsFilename(userName, when = new Date()) {
  const date =
    when instanceof Date
      ? when
      : typeof when === 'string' && /^\d{4}-\d{2}-\d{2}/.test(when)
        ? new Date(`${when.slice(0, 10)}T12:00:00`)
        : new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${slugifyReportName(userName)}_personal_analytics_report_${y}-${m}-${d}.pdf`;
}
