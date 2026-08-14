import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const statusConfig = {
  active: { label: 'Sedang Absen', bg: 'bg-blue-100', color: 'text-blue-700', darkBg: 'dark:bg-blue-900/40', darkColor: 'dark:text-blue-300' },
  completed: { label: 'Selesai', bg: 'bg-green-100', color: 'text-green-700', darkBg: 'dark:bg-green-900/40', darkColor: 'dark:text-green-300' },
  izin: { label: 'Izin', bg: 'bg-yellow-100', color: 'text-yellow-700', darkBg: 'dark:bg-yellow-900/40', darkColor: 'dark:text-yellow-300' },
};

function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, bg: 'bg-gray-100', color: 'text-gray-600', darkBg: 'dark:bg-gray-700', darkColor: 'dark:text-gray-400' };
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color} ${config.darkBg} ${config.darkColor}`}
    >
      {config.label}
    </span>
  );
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function AttendanceLogs() {
  const { isDark } = useTheme();
  const [logs, setLogs] = useState([]);
  const [scope, setScope] = useState('own');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/attendance/logs');
        setLogs(res.data.data || []);
        setScope(res.data.scope || 'own');
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal memuat riwayat absensi.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      <h1 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Riwayat Absensi</h1>
      <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {scope === 'all'
          ? 'Menampilkan riwayat absensi semua staff (4 minggu terakhir).'
          : 'Menampilkan riwayat absensi Anda sendiri (4 minggu terakhir).'}
      </p>

      <div className={`mt-6 rounded-2xl p-6 shadow-sm overflow-x-auto border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        {loading ? (
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>Memuat riwayat...</p>
        ) : error ? (
          <div className={`rounded-lg p-4 text-sm ${isDark ? 'bg-red-900/30 border border-red-700 text-red-300' : 'bg-red-50 border border-red-100 text-red-600'}`}>{error}</div>
        ) : logs.length === 0 ? (
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>Belum ada riwayat absensi dalam 4 minggu terakhir.</p>
        ) : (
          <table className={`w-full text-left text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <thead>
              <tr className={`border-b text-xs uppercase ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                {scope === 'all' && <th className="pb-3 pr-4 font-medium">Nama</th>}
                <th className="pb-3 pr-4 font-medium">Check-in</th>
                <th className="pb-3 pr-4 font-medium">Check-out</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Catatan / Alasan Izin</th>
                <th className="pb-3 font-medium">Foto</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {logs.map((log) => (
                <tr key={log.id}>
                  {scope === 'all' && (
                    <td className={`py-3 pr-4 font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{log.full_name}</td>
                  )}
                  <td className={`py-3 pr-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{formatDateTime(log.check_in_at)}</td>
                  <td className={`py-3 pr-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{formatDateTime(log.check_out_at)}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className={`py-3 pr-4 max-w-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {log.status === 'izin' ? log.izin_reason : log.notes || '-'}
                  </td>
                  <td className="py-3">
                    {log.photos && log.photos.length > 0 ? (
                      <div className="flex gap-1">
                        {log.photos.slice(0, 3).map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={url}
                              alt={`Foto ${i + 1}`}
                              className={`w-8 h-8 rounded object-cover border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                            />
                          </a>
                        ))}
                        {log.photos.length > 3 && (
                          <span className={`text-xs self-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>+{log.photos.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AttendanceLogs;
