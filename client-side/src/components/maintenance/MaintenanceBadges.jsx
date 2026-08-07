const statusConfig = {
  scheduled: { label: 'Dijadwalkan', bg: '#fef3c7', color: '#d97706' },
  in_progress: { label: 'Berlangsung', bg: '#dbeafe', color: '#2563eb' },
  completed: { label: 'Selesai', bg: '#dcfce7', color: '#16a34a' },
  canceled: { label: 'Dibatalkan', bg: '#fee2e2', color: '#dc2626' },
};

const emptyStatusConfig = { label: 'Belum Dijadwalkan', bg: '#f3f4f6', color: '#9ca3af' };

const housekeepingConfig = {
  clean: { label: 'Clean', bg: '#dcfce7', color: '#16a34a' },
  dirty: { label: 'Dirty', bg: '#fee2e2', color: '#dc2626' },
  cleaning: { label: 'Sedang Cleaning', bg: '#fef3c7', color: '#d97706' },
};

function StatusBadge({ status }) {
  const config = status ? statusConfig[status] || { label: status, bg: '#f3f4f6', color: '#6b7280' } : emptyStatusConfig;
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}

function HousekeepingBadge({ status }) {
  const config = housekeepingConfig[status] || { label: status || '-', bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}

export { StatusBadge, HousekeepingBadge };
