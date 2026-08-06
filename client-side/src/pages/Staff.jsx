import { useState, useEffect } from 'react';
import api from '../services/api';

const statusConfig = {
  on_duty: { label: 'On Duty', bg: '#dcfce7', color: '#16a34a' },
  standby: { label: 'Standby', bg: '#dbeafe', color: '#2563eb' }, // belum kepakai -- nunggu fitur absensi
  offline: { label: 'Offline', bg: '#f1f3f5', color: '#6b7280' },
};

function StatusBadge({ status }) {
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

function Staff() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get('/staff/overview');
        setStaffList(res.data.data || []);
      } catch (err) {
        console.error('Gagal mengambil data staff:', err.response?.status, err.response?.data || err.message);
        setError(err.response?.data?.message || 'Gagal memuat data staff.');
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">Staff</h1>
      <p className="text-gray-500 mt-2">Daftar staff Hotel Grand Nusantara</p>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
        {loading ? (
          <p className="text-gray-400 text-sm">Memuat data staff...</p>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-600">
            {error}
          </div>
        ) : staffList.length === 0 ? (
          <p className="text-gray-400 text-sm">Belum ada data staff.</p>
        ) : (
          <table className="w-full text-left table-auto md:table-fixed">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">No</th>
                <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">Nama Petugas</th>
                <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">Posisi</th>
                <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">No. Handphone</th>
                <th className="text-gray-800 text-sm font-semibold pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {staffList.map((staff, idx) => (
                <tr key={staff.id}>
                  <td className="py-4 pr-4 text-gray-500 text-sm">{idx + 1}</td>
                  <td className="py-4 pr-4 text-gray-800 text-sm font-medium">{staff.full_name}</td>
                  <td className="py-4 pr-4 text-gray-500 text-sm">{staff.position}</td>
                  <td className="py-4 pr-4 text-gray-500 text-sm">{staff.phone || '-'}</td>
                  <td className="py-4 text-sm">
                    <StatusBadge status={staff.status} />
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

export default Staff;