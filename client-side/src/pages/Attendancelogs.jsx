import { useState, useEffect } from 'react';
import api from '../services/api';

const statusConfig = {
  active: { label: 'Sedang Absen', bg: '#dbeafe', color: '#2563eb' },
  completed: { label: 'Selesai', bg: '#dcfce7', color: '#16a34a' },
  izin: { label: 'Izin', bg: '#fef3c7', color: '#d97706' },
};

function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, bg: '#f1f3f5', color: '#6b7280' };
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: config.bg, color: config.color }}
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
  const [logs, setLogs] = useState([]);
  const [scope, setScope] = useState('own'); // 'own' | 'all' -- dari response backend
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
      <h1 className="text-2xl font-bold text-gray-800">Riwayat Absensi</h1>
      <p className="text-gray-500 mt-2">
        {scope === 'all'
          ? 'Menampilkan riwayat absensi semua staff (4 minggu terakhir).'
          : 'Menampilkan riwayat absensi Anda sendiri (4 minggu terakhir).'}
      </p>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
        {loading ? (
          <p className="text-gray-400 text-sm">Memuat riwayat...</p>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-600">{error}</div>
        ) : logs.length === 0 ? (
          <p className="text-gray-400 text-sm">Belum ada riwayat absensi dalam 4 minggu terakhir.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase">
                {scope === 'all' && <th className="pb-3 pr-4 font-medium">Nama</th>}
                <th className="pb-3 pr-4 font-medium">Check-in</th>
                <th className="pb-3 pr-4 font-medium">Check-out</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Catatan / Alasan Izin</th>
                <th className="pb-3 font-medium">Foto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id}>
                  {scope === 'all' && (
                    <td className="py-3 pr-4 font-medium text-gray-800">{log.full_name}</td>
                  )}
                  <td className="py-3 pr-4 text-gray-600">{formatDateTime(log.check_in_at)}</td>
                  <td className="py-3 pr-4 text-gray-600">{formatDateTime(log.check_out_at)}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="py-3 pr-4 text-gray-600 max-w-xs">
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
                              className="w-8 h-8 rounded object-cover border border-gray-200"
                            />
                          </a>
                        ))}
                        {log.photos.length > 3 && (
                          <span className="text-xs text-gray-400 self-center">+{log.photos.length - 3}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300">-</span>
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