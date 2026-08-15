const MONTH_ABBREVIATIONS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

export function formatCurrency(value, { decimals = 0 } = {}) {
  const num = Number(value) || 0;
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrencyCompact(value) {
  const num = Number(value) || 0;
  if (Math.abs(num) >= 1000) {
    return `$${Math.round(num / 1000)}k`;
  }
  return `$${Math.round(num)}`;
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

export function formatPercent(value, { decimals = 1 } = {}) {
  if (value === null || value === undefined) return null;
  return `${Number(value).toFixed(decimals)}%`;
}

export function formatDateLong(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${MONTH_ABBREVIATIONS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function formatDateISO(dateStr) {
  if (!dateStr) return '—';
  return String(dateStr).slice(0, 10);
}

export function formatMonthAbbrev(period) {
  const [, month] = String(period).split('-');
  return MONTH_ABBREVIATIONS[Number(month) - 1] || period;
}

export function daysAgo(dateStr) {
  if (!dateStr) return null;
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diffMs = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diffMs / 86400000);
}

export function formatDeadline(days) {
  if (days === null || days === undefined) return '—';
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Due today';
  return `${days} days`;
}
