import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';

/* eslint-disable react-hooks/set-state-in-effect */

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusLabel = {
  active: 'Aktif',
  completed: 'Selesai',
  izin: 'Izin',
};

const statusColor = {
  active: { bg: '#dcfce7', color: '#16a34a' },
  completed: { bg: '#dbeafe', color: '#2563eb' },
  izin: { bg: '#fef3c7', color: '#d97706' },
};

function StatusBadge({ status }) {
  const config = statusColor[status] || { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {statusLabel[status] || status || '-'}
    </span>
  );
}

function AbsensiLogs() {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingStaff, setViewingStaff] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchStaff = async () => {
    try {
      const res = await api.get('/staff/overview');
      setStaffList(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleViewLogs = async (staff) => {
    setViewingStaff(staff);
    setLogsLoading(true);
    try {
      const res = await api.get('/attendance/logs', {
        params: { employee_id: staff.id },
      });
      setLogs(res.data.data || []);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.message || 'Gagal memuat log absensi.',
      });
    } finally {
      setLogsLoading(false);
    }
  };

  const handleBack = () => {
    setViewingStaff(null);
    setLogs([]);
  };

  const handleViewPhotos = (log) => {
    setSelectedLog(log);
    setPhotoModalOpen(true);
  };

  const closePhotoModal = () => {
    setPhotoModalOpen(false);
    setSelectedLog(null);
  };

  const goToStaffStatus = () => {
    navigate('/staff');
  };

  // Filter daftar staff berdasarkan nama, posisi, atau no. handphone
  const filteredStaffList = staffList.filter((staff) => {
    const query = searchQuery.toLowerCase();
    return (
      staff.full_name?.toLowerCase().includes(query) ||
      staff.position?.toLowerCase().includes(query) ||
      staff.phone?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-4 sm:p-6 bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
            {viewingStaff ? `Log Absensi - ${viewingStaff.full_name}` : 'Log Absensi'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {viewingStaff
              ? `Riwayat absensi untuk ${viewingStaff.full_name}`
              : 'Pilih staff untuk melihat log absensi'}
          </p>
        </div>
        {viewingStaff ? (
          <button
            onClick={handleBack}
            className="w-full sm:w-auto rounded-lg border border-gray-200 px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            Kembali ke Daftar Staff
          </button>
        ) : (
          <button
            onClick={goToStaffStatus}
            className="w-full sm:w-auto rounded-lg border border-gray-200 px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            Kembali ke Status Staff
          </button>
        )}
      </div>

      {!viewingStaff ? (
        // ===== Daftar Staff (card style) =====
        <>
          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow p-4 mb-6">
            <input
              type="text"
              placeholder="Cari nama, posisi, atau no. handphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {loading ? (
          <p className="text-gray-400 text-sm">Memuat data staff...</p>
        ) : filteredStaffList.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400 text-sm">
            {staffList.length === 0 ? 'Belum ada data staff.' : 'Tidak ada staff yang cocok dengan pencarian.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStaffList.map((staff) => (
              <div key={staff.id} className="bg-white rounded-2xl shadow p-4 sm:p-5 transition-all">
                {/* Top Section: Nama & Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-xl text-sm break-words">
                      {staff.full_name}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {staff.position || '-'}
                    </span>
                  </div>
                  <StatusBadge status={staff.status} />
                </div>

                {/* Bottom Section: Handphone & Aksi */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">No. Handphone:</span>
                    <span className="font-semibold text-gray-700">{staff.phone || '-'}</span>
                  </div>
                  <button
                    onClick={() => handleViewLogs(staff)}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all"
                  >
                    <EyeIcon />
                    Lihat Log Absensi
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </>
      ) : (
        // ===== Log Absensi Staff Terpilih (card style) =====
        logsLoading ? (
          <p className="text-gray-400 text-sm">Memuat log absensi...</p>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400 text-sm">
            Belum ada data absensi untuk staff ini.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-white rounded-2xl shadow p-4 sm:p-5 transition-all">
                {/* Top Section: Tanggal & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-xl text-sm">
                      {formatDate(log.check_in_at)}
                    </span>
                    <StatusBadge status={log.status} />
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    <i className="fa-regular fa-clock"></i>{' '}
                    {formatTime(log.check_in_at)} - {formatTime(log.check_out_at)}
                  </span>
                </div>

                {/* Bottom Section: Check In/Out, Catatan, Foto */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-gray-400">Check In:</span>
                    <span className="font-semibold text-gray-700">{formatTime(log.check_in_at)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-gray-400">Check Out:</span>
                    <span className="font-semibold text-gray-700">{formatTime(log.check_out_at)}</span>
                  </div>

                  {log.notes && (
                    <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 mt-2 break-words">
                      <span className="font-semibold text-gray-500 block mb-1">
                        Catatan:
                      </span>
                      {log.notes}
                    </div>
                  )}

                  {Array.isArray(log.photos) && log.photos.length > 0 && (
                    <div className="flex sm:justify-end pt-1">
                      <button
                        onClick={() => handleViewPhotos(log)}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all"
                      >
                        <EyeIcon />
                        Lihat Foto
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {photoModalOpen && selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={closePhotoModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl gap-3">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 break-words">
                Foto Absensi - {formatDate(selectedLog.check_in_at)}
              </h3>
              <button
                onClick={closePhotoModal}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Tutup"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {Array.isArray(selectedLog.photos) && selectedLog.photos.length > 0 ? (
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4">
                  {selectedLog.photos.map((photo, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={photo}
                        alt={`Foto absensi ${idx + 1}`}
                        className="w-full h-40 object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center py-8">Tidak ada foto untuk absensi ini.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AbsensiLogs;