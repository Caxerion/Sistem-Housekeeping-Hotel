import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';

/* eslint-disable react-hooks/set-state-in-effect */

const statusConfig = {
  on_duty: { label: 'On-Duty', bg: '#dcfce7', color: '#16a34a'},
  standby: { label: 'Stand By', bg: '#dbeafe', color: '#2563eb'},
  izin: { label: 'Izin', bg: '#dbeafe', color: '#d80a0a'},
  offline: { label: 'Tidak Hadir', bg: '#f1f3f5', color: '#6b7280'}
};

const statusFilterOptions = [
  { key: 'semua', label: 'Semua' },
  { key: 'on_duty', label: 'On-Duty' },
  { key: 'standby', label: 'Stand By' },
  { key: 'izin', label: 'Izin' },
  { key: 'offline', label: 'Tidak Hadir' },
];

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
  const [statusFilter, setStatusFilter] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');

  const [myAttendance, setMyAttendance] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [countdown, setCountdown] = useState('');

  const isWithinWorkingHours = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 6 && hour < 19;
  };

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentHour = now.getHours();
      let target = new Date(now);
      target.setHours(6, 0, 0, 0);

      if (currentHour >= 19) {
        target.setDate(target.getDate() + 1);
      } else if (currentHour < 6) {
        target.setDate(target.getDate());
      } else {
        setCountdown('');
        return;
      }

      const diff = target - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff% (1000 * 60)) / 1000);
      setCountdown(`${hours}j ${minutes}m ${seconds}d`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

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
      Swal.fire({
        icon: 'success',
        title: 'Absensi Berhasil!',
        text: 'Absensi Anda tercatat sebagai aktif',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.message || 'Gagal memulai absensi.',
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const goToEndAttendance = () => {
    navigate(`/attendance/end/${myAttendance.id}`);
  };

  const filteredStaffList = staffList.filter((staff) => {
    const matchesStatus = statusFilter === 'semua' || staff.status === statusFilter;
    const matchesSearch = (staff.full_name || '')
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">Staff</h1>
      <p className="text-gray-500 mt-2">Daftar staff Hotel Grand Nusantara</p>

      {/* ===== Slot Absensi (hanya untuk staff) ===== */}
      {user?.current_role === 'staff' && (
        <div className="mt-6 relative border border-dashed border-gray-300 rounded-2xl p-5">
          {!attendanceLoading && !(myAttendance && myAttendance.status === 'active') && (
            <button
              onClick={() => navigate('/izin')}
              disabled={!isWithinWorkingHours()}
              className="absolute -top-3 -right-3 px-4 py-1.5 text-sm font-semibold bg-white border border-amber-200 shadow-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed enabled:text-amber-600 enabled:hover:bg-amber-50"
            >
              {isWithinWorkingHours() ? 'Izin' : `Form Izin dibuka dalam ${countdown}`}
            </button>
          )}
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
          ) : myAttendance && myAttendance.status === 'completed' ? (
            <button
              disabled
              className="w-full py-4 text-center text-gray-500 font-semibold bg-gray-50 rounded-xl cursor-not-allowed"
            >
              {myAttendance.check_out_at
                ? `Absensi dibuka lagi pukul ${new Date(new Date(myAttendance.check_out_at).getTime() + 7 * 60 * 60 * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                : 'Absensi hanya bisa dilakukan sekali'}
            </button>
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
        {/* ===== Search Bar & Log Absensi ===== */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="relative w-full max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama petugas..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            />
          </div>

          {user?.current_role === 'admin' && (
            <button
              onClick={() => navigate('/absensi-logs')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shrink-0"
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
          )}
        </div>

        {/* ===== Filter Kategori Status ===== */}
        <div className="flex flex-wrap gap-2 mb-5">
          {statusFilterOptions.map((opt) => {
            const isActive = statusFilter === opt.key;
            const config = statusConfig[opt.key];
            return (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors"
                style={
                  isActive
                    ? {
                        backgroundColor: config ? config.color : '#374151',
                        borderColor: config ? config.color : '#374151',
                        color: '#ffffff',
                      }
                    : {
                        backgroundColor: '#ffffff',
                        borderColor: '#e5e7eb',
                        color: '#6b7280',
                      }
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Memuat data staff...</p>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-600">
            {error}
          </div>
        ) : filteredStaffList.length === 0 ? (
          <p className="text-gray-400 text-sm">
            {staffList.length === 0
              ? 'Belum ada data staff.'
              : searchQuery.trim() !== ''
              ? `Tidak ada staff dengan nama "${searchQuery}".`
              : 'Tidak ada staff dengan status ini.'}
          </p>
        ) : (
          <table className="w-full text-left table-auto md:table-fixed">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">No</th>
                <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">Nama Petugas</th>
                <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">Posisi</th>
                <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">Lokasi</th>
                <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">No. Handphone</th>
                <th className="text-gray-800 text-sm font-semibold pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStaffList.map((staff, idx) => (
                <tr key={staff.id}>
                  <td className="py-4 pr-4 text-gray-500 text-sm">{idx + 1}</td>
                  <td className="py-4 pr-4 text-gray-800 text-sm font-medium">{staff.full_name}</td>
                  <td className="py-4 pr-4 text-gray-500 text-sm">{staff.position}</td>
                  <td className="py-4 pr-4 text-sm">
                    {staff.shift ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {`Kamar ${staff.shift}`}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
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