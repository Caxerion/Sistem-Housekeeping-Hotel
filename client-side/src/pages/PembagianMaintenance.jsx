import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';

/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity */

const statusConfig = {
  scheduled: { label: 'Dijadwalkan', bg: '#fef3c7', color: '#d97706' },
  in_progress: { label: 'Berlangsung', bg: '#dbeafe', color: '#2563eb' },
  completed: { label: 'Selesai', bg: '#dcfce7', color: '#16a34a' },
  canceled: { label: 'Dibatalkan', bg: '#fee2e2', color: '#dc2626' },
};

// Untuk baris kamar yang belum pernah punya jadwal maintenance sama sekali
const emptyStatusConfig = { label: 'Belum Dijadwalkan', bg: '#f3f4f6', color: '#9ca3af' };

const housekeepingConfig = {
  clean: { label: 'Clean', bg: '#dcfce7', color: '#16a34a' },
  dirty: { label: 'Dirty', bg: '#fee2e2', color: '#dc2626' },
  cleaning: { label: 'Sedang Cleaning', bg: '#fef3c7', color: '#d97706' },
};

function StatusBadge({ status }) {
  const config = status ? statusConfig[status] || { label: status, bg: '#f3f4f6', color: '#6b7280' } : emptyStatusConfig;
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}

function HousekeepingBadge({ status }) {
  const config = housekeepingConfig[status] || { label: status || '-', bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}

// Menghasilkan daftar token halaman: angka biasa, atau penanda ellipsis
// ('ellipsis-left' / 'ellipsis-right') yang nanti dirender jadi input angka.
function buildPageTokens(current, total) {
  const delta = 1;
  const tokens = [1];

  const rangeStart = Math.max(2, current - delta);
  const rangeEnd = Math.min(total - 1, current + delta);

  if (rangeStart > 2) tokens.push('ellipsis-left');

  for (let page = rangeStart; page <= rangeEnd; page++) {
    tokens.push(page);
  }

  if (rangeEnd < total - 1) tokens.push('ellipsis-right');

  if (total > 1) tokens.push(total);

  return tokens;
}

const initialForm = {
  room_id: '',
  title: '',
  notes: '',
  scheduled_date: '',
  set_immediately: false,
  staff_ids: [],
};

function PembagianMaintenance() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);
  const staffDropdownRef = useRef(null);

  // Search & pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEllipsis, setEditingEllipsis] = useState(null); // 'ellipsis-left' | 'ellipsis-right' | null
  const [pageInput, setPageInput] = useState('');
  const itemsPerPage = 10;

  const fetchAll = async () => {
    try {
      const [roomsRes, staffRes, schedRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/room-schedule/staff'),
        api.get('/room-schedule'),
      ]);
      const allRooms = roomsRes.data.data || [];
      setRooms(allRooms.filter((r) => r.occupancy_status === 'available'));
      setStaffList(staffRes.data.data || []);
      setSchedules(schedRes.data.data || []);
    } catch (err) {
      console.error('Gagal memuat data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const visibleSchedules = schedules.map((sched) => {
    const isTerminal = sched.status === 'completed' || sched.status === 'canceled';
    if (isTerminal) {
      const terminalTime = sched.completed_at
        ? new Date(sched.completed_at).getTime()
        : new Date(sched.updated_at).getTime();
      if (now - terminalTime >= 5 * 60 * 1000) {
        return {
          ...sched,
          title: null,
          notes: null,
          scheduled_date: null,
          status: null,
          started_at: null,
          completed_at: null,
          assigned_staff: [],
          dijadwalkan_oleh: null,
          housekeeping_status: 'clean',
        };
      }
    }
    return sched;
  });

  // Filter berdasarkan search: cocokkan nomor kamar atau nama petugas yang ditugaskan
  const filteredSchedules = visibleSchedules.filter((sched) => {
    if (!search.trim()) return true;
    const keyword = search.toLowerCase();
    const matchRoom = sched.no_kamar?.toLowerCase().includes(keyword);
    const matchStaff =
      Array.isArray(sched.assigned_staff) &&
      sched.assigned_staff.some((name) => name?.toLowerCase().includes(keyword));
    return matchRoom || matchStaff;
  });

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSchedules = filteredSchedules.slice(startIndex, startIndex + itemsPerPage);

  const pageTokens = buildPageTokens(currentPage, totalPages);

  function openEllipsisInput(token) {
    setEditingEllipsis(token);
    setPageInput('');
  }

  function submitPageInput() {
    const target = parseInt(pageInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      setCurrentPage(target);
    }
    setEditingEllipsis(null);
    setPageInput('');
  }

  function handlePageInputKeyDown(e) {
    if (e.key === 'Enter') {
      submitPageInput();
    } else if (e.key === 'Escape') {
      setEditingEllipsis(null);
      setPageInput('');
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(e.target)) {
        setStaffDropdownOpen(false);
      }
    };
    if (staffDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [staffDropdownOpen]);

  const toggleStaff = (id) => {
    setForm((prev) => ({
      ...prev,
      staff_ids: prev.staff_ids.includes(id)
        ? prev.staff_ids.filter((s) => s !== id)
        : [...prev.staff_ids, id],
    }));
  };

  const openModal = () => {
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setStaffDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.room_id || !form.title || !form.scheduled_date) {
      Swal.fire({
        icon: 'warning',
        title: 'Data tidak lengkap',
        text: 'Kamar, judul, dan tanggal wajib diisi.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/room-schedule', {
        room_id: Number(form.room_id),
        title: form.title,
        notes: form.notes,
        scheduled_date: form.scheduled_date,
        set_immediately: form.set_immediately,
        staff_ids: form.staff_ids,
      });

      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false,
        });
        closeModal();
        fetchAll();
        window.dispatchEvent(new Event('refresh-dashboard-trend'));
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal membuat jadwal maintenance.';
      Swal.fire({ icon: 'error', title: 'Gagal', text: message });
    } finally {
      setSubmitting(false);
    }
  };

  const refreshSchedules = async () => {
    const schedRes = await api.get('/room-schedule');
    setSchedules(schedRes.data.data || []);
    setNow(Date.now());
    // rooms available juga bisa berubah (misal setelah complete)
    const roomsRes = await api.get('/rooms');
    setRooms((roomsRes.data.data || []).filter((r) => r.occupancy_status === 'available'));
  };

  const handleStart = async (id) => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Mulai maintenance?',
      text: 'Kamar akan di-set menjadi maintenance.',
      showConfirmButton: true,
      confirmButtonText: 'Ya, mulai',
      cancelButtonText: 'Batal',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await api.put(`/room-schedule/${id}/start`);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false,
        });
        refreshSchedules();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal memulai maintenance.' });
    }
  };

  const handleComplete = async (id) => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Selesaikan maintenance?',
      text: 'Kamar akan kembali menjadi available & housekeeping status menjadi Clean.',
      showConfirmButton: true,
      confirmButtonText: 'Ya, selesaikan',
      cancelButtonText: 'Batal',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await api.put(`/room-schedule/${id}/complete`);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false,
        });
        refreshSchedules();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal menyelesaikan maintenance.' });
    }
  };

  const handleCancel = async (id) => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Batalkan jadwal?',
      text: 'Jadwal maintenance akan dibatalkan.',
      showConfirmButton: true,
      confirmButtonText: 'Ya, batalkan',
      cancelButtonText: 'Tidak',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await api.put(`/room-schedule/${id}/cancel`);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false,
        });
        refreshSchedules();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal membatalkan jadwal.' });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-4">
      <div className="p-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pembagian Maintenance</h1>
          <p className="text-gray-500 mt-2">Jadwalkan dan kelola maintenance kamar.</p>
        </div>

        {user?.current_role === 'admin' && (
          <button
            onClick={openModal}
            className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> Tambah Maintenance
          </button>
        )}
      </div>

      {/* ===== MODAL: Buat Jadwal Maintenance ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeModal}
          />

          {/* Modal card */}
          <div
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl">
              <h2 className="text-lg font-semibold text-gray-800">Buat Jadwal Maintenance</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Tutup"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              <div>
                <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
                  Kamar
                </label>
                <select
                  value={form.room_id}
                  onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  style={{ color: '#1f2937' }}
                  required
                >
                  <option value="">Pilih kamar...</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.room_number} - {room.room_type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
                  Judul Maintenance
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: Perawatan AC berkala"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  style={{ color: '#1f2937' }}
                  required
                />
              </div>

              <div>
                <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
                  Tanggal Maintenance
                </label>
                <input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  style={{ color: '#1f2937' }}
                  required
                />
              </div>

              <div className="relative" ref={staffDropdownRef}>
                <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
                  Petugas yang Ditugaskan
                </label>
                <button
                  type="button"
                  onClick={() => setStaffDropdownOpen((prev) => !prev)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-left flex items-center justify-between outline-none focus:border-blue-500"
                  style={{ color: form.staff_ids.length > 0 ? '#1f2937' : '#9ca3af' }}
                >
                  {form.staff_ids.length > 0
                    ? `${form.staff_ids.length} petugas dipilih`
                    : 'Pilih petugas...'}
                  <svg
                    className={`w-4 h-4 transition-transform ${staffDropdownOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {staffDropdownOpen && (
                  <div
                    className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-100 py-1"
                    style={{ maxHeight: '240px', overflowY: 'auto' }}
                  >
                    {staffList.length === 0 ? (
                      <p className="px-4 py-2 text-sm text-gray-400">Tidak ada data staff.</p>
                    ) : (
                      staffList.map((s) => (
                        <label
                          key={s.employee_id}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={form.staff_ids.includes(s.employee_id)}
                            onChange={() => toggleStaff(s.employee_id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span style={{ color: '#1f2937' }}>{s.full_name}</span>
                          <span
                            className="ml-auto text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: '#f1f3f5', color: '#6b7280' }}
                          >
                            {s.position}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
                  Catatan
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Catatan tambahan (opsional)"
                  rows="2"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  style={{ color: '#1f2937' }}
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="setImmediately"
                  checked={form.set_immediately}
                  onChange={(e) => setForm({ ...form, set_immediately: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="setImmediately" className="text-sm text-gray-700 cursor-pointer">
                  Mulai maintenance sekarang (kamar langsung di-set maintenance)
                </label>
              </div>

              <div className="md:col-span-2 flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-70 transition-colors"
                >
                  {submitting ? 'Menyimpan...' : 'Buat Jadwal'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-4 py-2.5 font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Table Card ===== */}
      <div
        className="p-6 rounded-xl border"
        style={{ backgroundColor: '#f9f9fa', borderColor: '#e5e7eb' }}
      >
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Daftar Jadwal Maintenance</h2>

          <div
            className="flex items-center rounded-full px-3 py-1 border"
            style={{ backgroundColor: '#ffffff', minWidth: '240px', borderColor: '#e5e7eb' }}
          >
            <i
              className="fa-solid fa-magnifying-glass me-2"
              style={{ color: '#9ca3af' }}
            ></i>
            <input
              type="text"
              placeholder="Cari nama petugas / no. kamar..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm"
              style={{ color: '#1f2937' }}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#6b7280' }}>Memuat data...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                  <th className="text-left py-3 px-4 font-medium">No. Kamar</th>
                  <th className="text-left py-3 px-4 font-medium">Judul</th>
                  <th className="text-left py-3 px-4 font-medium">Tanggal</th>
                  <th className="text-left py-3 px-4 font-medium">Petugas</th>
                  <th className="text-left py-3 px-4 font-medium">Housekeeping</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Aksi</th>
                </tr>
              </thead>
                <tbody>
                  {paginatedSchedules.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4" style={{ color: '#9ca3af' }}>
                        {search.trim() ? 'Tidak ada jadwal yang cocok.' : 'Belum ada jadwal maintenance.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedSchedules.map((sched, idx) => (
                    <tr key={sched.id ?? `empty-${sched.room_id}-${idx}`} style={{ borderColor: '#e5e7eb' }}>
                      <td
                        className="py-3 px-4 border-b font-semibold"
                        style={{ borderColor: '#e5e7eb', color: '#111827' }}
                      >
                        {sched.no_kamar}
                      </td>
                      <td
                        className="py-3 px-4 border-b"
                        style={{ borderColor: '#e5e7eb', color: sched.title ? '#1f2937' : '#9ca3af' }}
                      >
                        {sched.title || '-'}
                        {sched.notes && (
                          <p className="text-xs text-gray-400 mt-0.5">{sched.notes}</p>
                        )}
                      </td>
                      <td
                        className="py-3 px-4 border-b"
                        style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                      >
                        {sched.scheduled_date || '-'}
                      </td>
                      <td
                        className="py-3 px-4 border-b"
                        style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                      >
                        {Array.isArray(sched.assigned_staff) && sched.assigned_staff.length > 0
                          ? sched.assigned_staff.join(', ')
                          : '-'}
                      </td>
                      <td className="py-3 px-4 border-b" style={{ borderColor: '#e5e7eb' }}>
                        <HousekeepingBadge status={sched.housekeeping_status} />
                      </td>
                      <td className="py-3 px-4 border-b" style={{ borderColor: '#e5e7eb' }}>
                        <StatusBadge status={sched.status} />
                      </td>
                      <td className="py-3 px-4 border-b" style={{ borderColor: '#e5e7eb' }}>
                        <div className="flex gap-2">
                          {sched.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => handleStart(sched.id)}
                                className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                              >
                                Mulai
                              </button>
                              <button
                                onClick={() => handleCancel(sched.id)}
                                className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                              >
                                Batal
                              </button>
                            </>
                          )}
                          {sched.status === 'in_progress' && (
                            <>
                              <button
                                onClick={() => handleComplete(sched.id)}
                                className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                              >
                                Selesai
                              </button>
                              <button
                                onClick={() => handleCancel(sched.id)}
                                className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                              >
                                Batal
                              </button>
                            </>
                          )}
                          {(sched.status === 'completed' || sched.status === 'canceled' || !sched.status) && (
                            <span className="text-xs text-gray-400">Tidak ada aksi</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: '#f1f3f5',
                    color: currentPage === 1 ? '#9ca3af' : '#4b5563',
                    cursor: currentPage === 1 ? 'default' : 'pointer',
                  }}
                >
                  Previous
                </button>

                {pageTokens.map((token, idx) => {
                  // Token angka biasa -> tombol nomor halaman
                  if (typeof token === 'number') {
                    const isCurrent = token === currentPage;
                    return (
                      <button
                        key={token}
                        onClick={() => setCurrentPage(token)}
                        className="px-3 py-1 rounded-md text-sm font-medium transition-colors"
                        style={{
                          backgroundColor: isCurrent ? '#3b82f6' : '#f1f3f5',
                          color: isCurrent ? '#ffffff' : '#4b5563',
                        }}
                      >
                        {token}
                      </button>
                    );
                  }

                  // Token ellipsis yang lagi diklik -> ganti jadi input angka
                  if (editingEllipsis === token) {
                    return (
                      <input
                        key={`${token}-input`}
                        type="number"
                        min={1}
                        max={totalPages}
                        autoFocus
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onKeyDown={handlePageInputKeyDown}
                        onBlur={submitPageInput}
                        placeholder="No."
                        className="w-14 px-2 py-1 rounded-md text-sm text-center border focus:outline-none"
                        style={{ borderColor: '#3b82f6', color: '#1f2937' }}
                      />
                    );
                  }

                  // Token ellipsis biasa -> "..." yang bisa diklik
                  return (
                    <button
                      key={`${token}-${idx}`}
                      onClick={() => openEllipsisInput(token)}
                      title="Klik untuk lompat ke halaman tertentu"
                      className="px-2 py-1 text-sm rounded-md hover:bg-gray-100 transition-colors"
                      style={{ color: '#9ca3af' }}
                    >
                      ...
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: '#f1f3f5',
                    color: currentPage === totalPages ? '#9ca3af' : '#4b5563',
                    cursor: currentPage === totalPages ? 'default' : 'pointer',
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PembagianMaintenance;