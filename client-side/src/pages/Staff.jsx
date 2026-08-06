import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';

/* eslint-disable react-hooks/set-state-in-effect */

const statusConfig = {
  on_duty: { label: 'On Duty', bg: '#dcfce7', color: '#16a34a' },
  standby: { label: 'Standby', bg: '#dbeafe', color: '#2563eb' },
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

function formatTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function Staff() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [myAttendance, setMyAttendance] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(true);

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

  const fetchMyAttendance = async () => {
    try {
      const res = await api.get('/attendance/today');
      setMyAttendance(res.data.data);
    } catch (err) {
      console.error('Gagal mengambil status absensi:', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchMyAttendance();
  }, []);

  const handleStartAttendance = async () => {
    setCheckingIn(true);
    try {
      const res = await api.post('/attendance/check-in');
      setMyAttendance(res.data.data);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memulai absensi.');
    } finally {
      setCheckingIn(false);
    }
  };

  const goToEndAttendance = () => {
    navigate(`/attendance/end/${myAttendance.id}`);
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">Staff</h1>
      <p className="text-gray-500 mt-2">Daftar staff Hotel Grand Nusantara</p>

      {/* ===== Slot Absensi (hanya untuk staff) ===== */}
      {user?.current_role === 'staff' && (
        <div className="mt-6 border border-dashed border-gray-300 rounded-2xl p-5">
          {attendanceLoading ? (
            <p className="text-gray-400 text-sm">Memuat status absensi...</p>
          ) : myAttendance && myAttendance.status === 'active' ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm text-gray-500">Nama Lengkap</p>
                <p className="text-lg font-semibold text-gray-800">{myAttendance.full_name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Mulai shift: <span className="font-medium text-gray-700">{formatTime(myAttendance.check_in_at)}</span>
                </p>
              </div>
              <button
                onClick={goToEndAttendance}
                className="rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700 transition-colors"
              >
                Akhiri Absensi
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartAttendance}
              disabled={checkingIn}
              className="w-full py-4 text-center text-blue-600 font-semibold hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-60"
            >
              {checkingIn ? 'Memproses...' : '+ Lakukan Absensi'}
            </button>
          )}
        </div>
      )}

      {/* ===== Tabel Staff ===== */}
      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
        {user?.current_role === 'admin' && (
          <div className="flex justify-end mb-4">
            <button
              onClick={() => navigate('/absensi-logs')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Log Absensi
            </button>
          </div>
        )}
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
                <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">Shift</th>
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
                  <td className="py-4 pr-4 text-gray-500 text-sm">{staff.shift || '-'}</td>
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
