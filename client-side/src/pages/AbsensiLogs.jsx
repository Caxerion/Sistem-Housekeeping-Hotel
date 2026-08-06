import { useState, useEffect } from 'react';
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

function AbsensiLogs() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingStaff, setViewingStaff] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

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

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {viewingStaff ? `Log Absensi - ${viewingStaff.full_name}` : 'Log Absensi'}
          </h1>
          <p className="text-gray-500 mt-2">
            {viewingStaff
              ? `Riwayat absensi untuk ${viewingStaff.full_name}`
              : 'Pilih staff untuk melihat log absensi'}
          </p>
        </div>
        {viewingStaff && (
          <button
            onClick={handleBack}
            className="rounded-lg border border-gray-200 px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Kembali ke Daftar Staff
          </button>
        )}
      </div>

      {!viewingStaff ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
          {loading ? (
            <p className="text-gray-400 text-sm">Memuat data staff...</p>
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
                  <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">Status</th>
                  <th className="text-gray-800 text-sm font-semibold pb-3">Aksi</th>
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
                      <span
                        className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: statusColor[staff.status]?.bg || '#f3f4f6',
                          color: statusColor[staff.status]?.color || '#6b7280',
                        }}
                      >
                        {statusLabel[staff.status] || staff.status || '-'}
                      </span>
                    </td>
                    <td className="py-4 text-sm">
                      <button
                        onClick={() => handleViewLogs(staff)}
                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Lihat Log Absensi"
                      >
                        <EyeIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
          {logsLoading ? (
            <p className="text-gray-400 text-sm">Memuat log absensi...</p>
          ) : logs.length === 0 ? (
            <p className="text-gray-400 text-sm">Belum ada data absensi untuk staff ini.</p>
          ) : (
            <table className="w-full text-left table-auto md:table-fixed">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">Tanggal</th>
                  <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">Check In</th>
                  <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">Check Out</th>
                  <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">Status</th>
                  <th className="text-gray-800 text-sm font-semibold pb-3 pr-4">Catatan</th>
                  <th className="text-gray-800 text-sm font-semibold pb-3">Foto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-4 pr-4 text-gray-800 text-sm">{formatDate(log.check_in_at)}</td>
                    <td className="py-4 pr-4 text-gray-600 text-sm">{formatTime(log.check_in_at)}</td>
                    <td className="py-4 pr-4 text-gray-600 text-sm">{formatTime(log.check_out_at)}</td>
                    <td className="py-4 text-sm">
                      <span
                        className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: statusColor[log.status]?.bg || '#f3f4f6',
                          color: statusColor[log.status]?.color || '#6b7280',
                        }}
                      >
                        {statusLabel[log.status] || log.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-gray-600 text-sm max-w-xs truncate" title={log.notes || '-'}>
                      {log.notes || '-'}
                    </td>
                    <td className="py-4 text-sm">
                      {Array.isArray(log.photos) && log.photos.length > 0 ? (
                        <button
                          onClick={() => handleViewPhotos(log)}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Lihat Foto"
                        >
                          <EyeIcon />
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">Tidak ada foto</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-800">
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
            <div className="p-6">
              {Array.isArray(selectedLog.photos) && selectedLog.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
