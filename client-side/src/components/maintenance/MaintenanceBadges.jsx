import { useTheme } from '../../context/ThemeContext';

const statusConfig = {
  scheduled: { label: 'Dijadwalkan', lightBg: 'bg-yellow-100', lightColor: 'text-yellow-700', darkBg: 'bg-yellow-900/40', darkColor: 'text-yellow-300' },
  in_progress: { label: 'Berlangsung', lightBg: 'bg-blue-100', lightColor: 'text-blue-700', darkBg: 'bg-blue-900/40', darkColor: 'text-blue-300' },
  completed: { label: 'Selesai', lightBg: 'bg-green-100', lightColor: 'text-green-700', darkBg: 'bg-green-900/40', darkColor: 'text-green-300' },
  canceled: { label: 'Dibatalkan', lightBg: 'bg-red-100', lightColor: 'text-red-700', darkBg: 'bg-red-900/40', darkColor: 'text-red-300' },
};

const emptyStatusConfig = { label: 'Belum Dijadwalkan', lightBg: 'bg-gray-100', lightColor: 'text-gray-500', darkBg: 'bg-gray-700', darkColor: 'text-gray-400' };

const housekeepingConfig = {
  clean: { label: 'Clean', lightBg: 'bg-green-100', lightColor: 'text-green-700', darkBg: 'bg-green-900/40', darkColor: 'text-green-300' },
  dirty: { label: 'Dirty', lightBg: 'bg-red-100', lightColor: 'text-red-700', darkBg: 'bg-red-900/40', darkColor: 'text-red-300' },
  cleaning: { label: 'Sedang Cleaning', lightBg: 'bg-yellow-100', lightColor: 'text-yellow-700', darkBg: 'bg-yellow-900/40', darkColor: 'text-yellow-300' },
};

function StatusBadge({ status }) {
  const { isDark } = useTheme();
  const config = status ? statusConfig[status] || { label: status, lightBg: 'bg-gray-100', lightColor: 'text-gray-600', darkBg: 'bg-gray-700', darkColor: 'text-gray-400' } : emptyStatusConfig;
  const bg = isDark ? config.darkBg : config.lightBg;
  const color = isDark ? config.darkColor : config.lightColor;
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${bg} ${color}`}
    >
      {config.label}
    </span>
  );
}

function HousekeepingBadge({ status }) {
  const { isDark } = useTheme();
  const config = housekeepingConfig[status] || { label: status || '-', lightBg: 'bg-gray-100', lightColor: 'text-gray-600', darkBg: 'bg-gray-700', darkColor: 'text-gray-400' };
  const bg = isDark ? config.darkBg : config.lightBg;
  const color = isDark ? config.darkColor : config.lightColor;
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${bg} ${color}`}
    >
      {config.label}
    </span>
  );
}

export { StatusBadge, HousekeepingBadge };
