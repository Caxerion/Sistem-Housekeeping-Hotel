function StatusBadge({ status }) {
  const statusConfig = {
    on_duty: { label: 'On-Duty', bg: '#dcfce7', color: '#16a34a' },
    standby: { label: 'Stand By', bg: '#dbeafe', color: '#2563eb' },
    izin: { label: 'Izin', bg: '#dbeafe', color: '#d80a0a' },
    offline: { label: 'Tidak Hadir', bg: '#f1f3f5', color: '#6b7280' },
  };

  const config = statusConfig[status] || { label: status || '-', bg: '#f1f3f5', color: '#6b7280' };
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}

export default StatusBadge;
