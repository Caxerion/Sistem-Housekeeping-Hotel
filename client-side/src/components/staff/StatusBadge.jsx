import { useTheme } from '../../context/ThemeContext';

function StatusBadge({ status }) {
  const { isDark } = useTheme();
  const statusConfig = {
    on_duty: { label: 'On-Duty', lightBg: 'bg-green-100', lightColor: 'text-green-700', darkBg: 'bg-green-900/40', darkColor: 'text-green-300' },
    standby: { label: 'Stand By', lightBg: 'bg-blue-100', lightColor: 'text-blue-700', darkBg: 'bg-blue-900/40', darkColor: 'text-blue-300' },
    izin: { label: 'Izin', lightBg: 'bg-yellow-100', lightColor: 'text-yellow-700', darkBg: 'bg-yellow-900/40', darkColor: 'text-yellow-300' },
    offline: { label: 'Tidak Hadir', lightBg: 'bg-gray-100', lightColor: 'text-gray-600', darkBg: 'bg-gray-700', darkColor: 'text-gray-400' },
  };

  const config = statusConfig[status] || { label: status || '-', lightBg: 'bg-gray-100', lightColor: 'text-gray-600', darkBg: 'bg-gray-700', darkColor: 'text-gray-400' };
  const bg = isDark ? config.darkBg : config.lightBg;
  const color = isDark ? config.darkColor : config.lightColor;
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${bg} ${color}`}
    >
      {config.label}
    </span>
  );
}

export default StatusBadge;
