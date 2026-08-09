/* eslint-disable react-refresh/only-export-components */
function parseLocalDateTime(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;

  if (dateStr.includes(' ')) {
    const [datePart, timePart] = dateStr.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = (timePart || '00:00:00').split(':').map(Number);
    return new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const dateObj = dateStr instanceof Date ? dateStr : parseLocalDateTime(dateStr);
  if (!dateObj || isNaN(dateObj.getTime())) return '-';
  return dateObj.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr) {
  if (!dateStr) return '-';
  const dateObj = dateStr instanceof Date ? dateStr : parseLocalDateTime(dateStr);
  if (!dateObj || isNaN(dateObj.getTime())) return '-';
  return dateObj.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getWeekInfo(dateStr) {
  const date = parseLocalDateTime(dateStr);
  if (!date || isNaN(date.getTime())) return null;
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  const lastDay = new Date(year, month + 1, 0).getDate();

  let weekNum, weekStart, weekEnd;
  if (day <= 7) {
    weekNum = 1;
    weekStart = 1;
    weekEnd = Math.min(7, lastDay);
  } else if (day <= 14) {
    weekNum = 2;
    weekStart = 8;
    weekEnd = Math.min(14, lastDay);
  } else if (day <= 21) {
    weekNum = 3;
    weekStart = 15;
    weekEnd = Math.min(21, lastDay);
  } else {
    weekNum = 4;
    weekStart = 22;
    weekEnd = lastDay;
  }

  const monthName = new Date(year, month, 1).toLocaleDateString('id-ID', { month: 'long' });
  return {
    weekNum,
    weekStart,
    weekEnd,
    month: monthName,
    year,
    periodKey: `${year}-${String(month + 1).padStart(2, '0')}`,
    weekKey: `Minggu ${weekNum}`,
    label: `Minggu ${weekNum} (${weekStart} - ${weekEnd} ${monthName} ${year})`,
    periodLabel: `${monthName} ${year}`,
  };
}

function groupLogsByPeriod(logs) {
  const groups = {};
  logs.forEach((log) => {
    const sourceDate = log.status === 'izin' ? log.izin_start_at : log.check_in_at;
    if (!sourceDate) return;
    const date = parseLocalDateTime(sourceDate);
    if (!date || isNaN(date.getTime())) return;
    const info = getWeekInfo(sourceDate);
    if (!info) return;
    const { periodKey, weekKey, label } = info;
    if (!groups[periodKey]) groups[periodKey] = {};
    if (!groups[periodKey][weekKey]) groups[periodKey][weekKey] = { label, logs: [] };
    groups[periodKey][weekKey].logs.push(log);
  });
  return groups;
}

function getAvailablePeriods(logs) {
  const periods = new Set();
  logs.forEach((log) => {
    const sourceDate = log.status === 'izin' ? log.izin_start_at : log.check_in_at;
    if (!sourceDate) return;
    const date = parseLocalDateTime(sourceDate);
    if (!date || isNaN(date.getTime())) return;
    const periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    periods.add(periodKey);
  });
  return Array.from(periods).sort().reverse();
}

const statusLabel = {
  active: 'Aktif',
  completed: 'Selesai',
  izin: 'Izin',
};

const statusColor = {
  active: { bg: '#dcfce7', color: '#16a34a', bar: '#22c55e' },
  completed: { bg: '#dbeafe', color: '#2563eb', bar: '#3b82f6' },
  izin: { bg: '#fef3c7', color: '#d97706', bar: '#f59e0b' },
};

function StatusBadge({ status }) {
  const config = statusColor[status] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {statusLabel[status] || status || '-'}
    </span>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function ClockIcon({ className = '' }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function CalendarIcon({ className = '' }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function deduplicateLogsByDate(logs) {
  const map = new Map();
  logs.forEach((log) => {
    const dateSource = log.status === 'izin' ? log.izin_start_at : log.check_in_at;
    const dateObj = parseLocalDateTime(dateSource);
    if (!dateObj || isNaN(dateObj.getTime())) return;
    const dateKey = `${log.employee_id}-${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    const existing = map.get(dateKey);
    if (!existing || log.id > existing.id) {
      map.set(dateKey, log);
    }
  });
  return Array.from(map.values()).sort((a, b) => b.id - a.id);
}

export {
  parseLocalDateTime,
  formatDate,
  formatTime,
  getWeekInfo,
  groupLogsByPeriod,
  getAvailablePeriods,
  deduplicateLogsByDate,
  statusLabel,
  statusColor,
  StatusBadge,
  EyeIcon,
  ClockIcon,
  CalendarIcon,
};
