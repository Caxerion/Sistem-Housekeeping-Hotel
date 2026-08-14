import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { StatusBadge, HousekeepingBadge } from '../components/maintenance/MaintenanceBadges';
import Swal from 'sweetalert2';
import { useTheme } from '../context/ThemeContext';

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

const StatusPembersihan = () => {
  const { isDark } = useTheme();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEllipsis, setEditingEllipsis] = useState(null);
  const [pageInput, setPageInput] = useState('');
  const [now, setNow] = useState(0);
  const [reviewModal, setReviewModal] = useState({ open: false, schedule: null });
  const [reviewAction, setReviewAction] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const itemsPerPage = 10;

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/cleaning-schedule');
      setSchedules(response.data?.data || []);
    } catch {
      console.error('Gagal memuat status pembersihan.');
    } finally {
      setLoading(false);
    }
  }, []);

  const openReviewModal = (schedule) => {
    if (!schedule || !schedule.schedule_id) {
      Swal.fire({ icon: 'warning', title: 'Data tidak valid', text: 'Jadwal tidak valid untuk direview.' });
      return;
    }
    setReviewModal({ open: true, schedule });
    setReviewAction(null);
    setReviewNote('');
  };

  const parsePhotos = (photos) => {
    if (Array.isArray(photos)) return photos;
    if (typeof photos === 'string') {
      try {
        const parsed = JSON.parse(photos);
        return Array.isArray(parsed) ? [parsed] : [photos];
      } catch {
        return [photos];
      }
    }
    return [];
  };

  const handleReviewSubmit = async () => {
    if (!reviewAction) {
      Swal.fire({ icon: 'warning', title: 'Pilih aksi', text: 'Silakan pilih Approve atau Disapprove.' });
      return;
    }

    const scheduleId = reviewModal.schedule?.schedule_id;
    if (!scheduleId) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Jadwal tidak valid. ID jadwal tidak ditemukan.' });
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/cleaning-schedule/${scheduleId}/inspect`, {
        action: reviewAction,
        note: reviewNote,
      });

      Swal.fire({
        icon: reviewAction === 'approve' ? 'success' : 'info',
        title: reviewAction === 'approve' ? 'Disetujui' : 'Revisi',
        text: reviewAction === 'approve' ? 'Pembersihan disetujui oleh supervisor.' : 'Pembersihan masuk revisi. Staff perlu memperbaiki sesuai catatan.',
        timer: 2000,
        showConfirmButton: false,
      });

      setReviewModal({ open: false, schedule: null });
      setReviewAction(null);
      setReviewNote('');
      fetchSchedules();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal melakukan review.' });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const eventSource = new EventSource(`http://localhost:3000/api/events?token=${token}`);

    const refresh = () => {
      fetchSchedules();
    };

    eventSource.addEventListener('connected', () => {
      console.log('SSE connected');
    });
    eventSource.addEventListener('schedule:created', refresh);
    eventSource.addEventListener('schedule:started', refresh);
    eventSource.addEventListener('schedule:completed', refresh);
    eventSource.addEventListener('schedule:canceled', refresh);
    eventSource.addEventListener('cleaning:created', refresh);
    eventSource.addEventListener('cleaning:started', refresh);
    eventSource.addEventListener('cleaning:completed', refresh);
    eventSource.addEventListener('cleaning:inspected', refresh);
    eventSource.addEventListener('cleaning:canceled', refresh);
    eventSource.addEventListener('schedule:staffAssigned', refresh);
    eventSource.addEventListener('cleaning:staffAssigned', refresh);

    return () => {
      eventSource.close();
    };
  }, [fetchSchedules]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
          ended_at: null,
          status: null,
          started_at: null,
          completed_at: null,
          updated_at: null,
          housekeeping_status: 'clean',
          assigned_staff: [],
          dijadwalkan_oleh: null,
          photos: null,
          inspection_status: null,
          inspection_note: null,
        };
      }
    }
    return sched;
  });

  const filteredSchedules = visibleSchedules.filter((sched) => {
    if (!search.trim()) return true;
    const keyword = search.toLowerCase();
    const matchRoom = sched.no_kamar?.toLowerCase().includes(keyword);
    const matchStaff =
      Array.isArray(sched.assigned_staff) &&
      sched.assigned_staff.some((name) => name?.toLowerCase().includes(keyword));
    const matchTitle = sched.title?.toLowerCase().includes(keyword);
    const matchRoomType = sched.room_type?.toLowerCase().includes(keyword);
    return matchRoom || matchStaff || matchTitle || matchRoomType;
  });

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSchedules = filteredSchedules.slice(startIndex, startIndex + itemsPerPage);

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

  const getDisplayStatus = (schedule) => {
    if (schedule.schedule_id && schedule.status) {
      return schedule.status;
    }
    return schedule.housekeeping_status || 'clean';
  };

  const pageTokens = buildPageTokens(currentPage, totalPages);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Status Pembersihan</h1>
        <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Daftar status pembersihan kamar beserta jadwal dan petugas yang ditugaskan.</p>
      </div>

      <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[#f9f9fa] border-[#e5e7eb]'}`}>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Daftar Status Pembersihan</h2>

          <div
            className={`flex items-center rounded-full px-3 py-1 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e5e7eb]'}`}
            style={{ minWidth: '240px' }}
          >
            <i
              className={`fa-solid fa-magnifying-glass me-2 ${isDark ? 'text-gray-400' : ''}`}
              style={{ color: isDark ? undefined : '#9ca3af' }}
            ></i>
            <input
              type="text"
              placeholder="Cari no. kamar / tipe / petugas..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className={`flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm ${isDark ? 'text-gray-100 placeholder-gray-400' : ''}`}
              style={{ color: isDark ? undefined : '#1f2937' }}
            />
          </div>
        </div>

        {loading ? (
          <p className={isDark ? 'text-gray-400' : ''} style={{ color: isDark ? undefined : '#6b7280' }}>Memuat data...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm responsive-table">
              <thead>
                <tr className={isDark ? 'text-gray-400' : ''} style={{ color: isDark ? undefined : '#6b7280', fontSize: '0.85rem' }}>
                  <th className="text-left py-3 px-4 font-medium">No</th>
                  <th className="text-left py-3 px-4 font-medium">Nama Kamar</th>
                  <th className="text-left py-3 px-4 font-medium">Tipe Kamar</th>
                  <th className="text-left py-3 px-4 font-medium">Tanggal</th>
                  <th className="text-left py-3 px-4 font-medium">Petugas</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Pemeriksaan</th>
                  <th className="text-left py-3 px-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSchedules.length === 0 ? (
                  <tr>
                    <td colSpan="8" className={`text-center py-4 ${isDark ? 'text-gray-500' : ''}`} style={{ color: isDark ? undefined : '#9ca3af' }}>
                      {search.trim() ? 'Tidak ada jadwal yang cocok.' : 'Belum ada jadwal pembersihan.'}
                    </td>
                  </tr>
                ) : (
                  paginatedSchedules.map((schedule, idx) => (
                    <tr key={schedule.schedule_id ?? `empty-${schedule.room_id}-${idx}`} className={isDark ? 'border-gray-700' : ''} style={{ borderColor: isDark ? undefined : '#e5e7eb' }}>
                      <td data-label="No" className={`py-3 px-4 border-b ${isDark ? 'text-gray-300' : ''}`} style={{ borderColor: isDark ? undefined : '#e5e7eb', color: isDark ? undefined : '#6b7280' }}>
                        {startIndex + idx + 1}
                      </td>
                      <td data-label="Nama Kamar" className={`py-3 px-4 border-b font-semibold ${isDark ? 'text-gray-100' : ''}`} style={{ borderColor: isDark ? undefined : '#e5e7eb', color: isDark ? undefined : '#111827' }}>
                        {schedule.no_kamar}
                      </td>
                      <td data-label="Tipe Kamar" className={`py-3 px-4 border-b ${isDark ? 'text-gray-300' : ''}`} style={{ borderColor: isDark ? undefined : '#e5e7eb', color: isDark ? undefined : '#6b7280' }}>
                        {schedule.room_type || '-'}
                      </td>
                      <td data-label="Tanggal" className={`py-3 px-4 border-b ${isDark ? 'text-gray-300' : ''}`} style={{ borderColor: isDark ? undefined : '#e5e7eb', color: isDark ? undefined : '#6b7280' }}>
                        {schedule.scheduled_date || '-'}
                      </td>
                      <td data-label="Petugas" className={`py-3 px-4 border-b ${isDark ? 'text-gray-300' : ''}`} style={{ borderColor: isDark ? undefined : '#e5e7eb' }}>
                        {Array.isArray(schedule.assigned_staff) && schedule.assigned_staff.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {schedule.assigned_staff.map((name, i) => (
                              <span
                                key={i}
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className={isDark ? 'text-gray-500' : ''} style={{ color: isDark ? undefined : '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td data-label="Status" className={`py-3 px-4 border-b ${isDark ? 'text-gray-300' : ''}`} style={{ borderColor: isDark ? undefined : '#e5e7eb' }}>
                        {schedule.schedule_id ? (
                          <StatusBadge status={getDisplayStatus(schedule)} />
                        ) : (
                          <HousekeepingBadge status={getDisplayStatus(schedule)} />
                        )}
                      </td>
                      <td data-label="Pemeriksaan" className={`py-3 px-4 border-b ${isDark ? 'text-gray-300' : ''}`} style={{ borderColor: isDark ? undefined : '#e5e7eb' }}>
                        {schedule.inspection_status === 'pending' && (
                          <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-medium ${isDark ? 'bg-yellow-900/40 text-yellow-300' : 'bg-yellow-100 text-yellow-700'}`}>
                            Menunggu Pemeriksaan
                          </span>
                        )}
                        {schedule.inspection_status === 'approved' && (
                          <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-medium ${isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700'}`}>
                            Disetujui
                          </span>
                        )}
                        {schedule.inspection_status === 'revision' && (
                          <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-medium ${isDark ? 'bg-orange-900/40 text-orange-300' : 'bg-orange-100 text-orange-700'}`}>
                            Revisi
                          </span>
                        )}
                        {!schedule.inspection_status && <span className={isDark ? 'text-gray-500' : ''} style={{ color: isDark ? undefined : '#9ca3af' }}>-</span>}
                      </td>
                      <td data-label="Aksi" className={`py-3 px-4 border-b ${isDark ? 'text-gray-300' : ''}`} style={{ borderColor: isDark ? undefined : '#e5e7eb' }}>
                        {schedule.inspection_status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => openReviewModal(schedule)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                          >
                            Review
                          </button>
                        ) : (
                          <span className={isDark ? 'text-gray-500' : ''} style={{ color: isDark ? undefined : '#9ca3af' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : ''}`}
                  style={{
                    backgroundColor: isDark ? undefined : '#f1f3f5',
                    color: isDark ? undefined : (currentPage === 1 ? '#9ca3af' : '#4b5563'),
                    cursor: isDark ? undefined : (currentPage === 1 ? 'default' : 'pointer'),
                  }}
                >
                  Previous
                </button>

                {pageTokens.map((token, idx) => {
                  if (typeof token === 'number') {
                    const isCurrent = token === currentPage;
                    return (
                      <button
                        key={token}
                        onClick={() => setCurrentPage(token)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : ''}`}
                        style={{
                          backgroundColor: isCurrent ? '#3b82f6' : (isDark ? undefined : '#f1f3f5'),
                          color: isCurrent ? '#ffffff' : (isDark ? undefined : '#4b5563'),
                        }}
                      >
                        {token}
                      </button>
                    );
                  }

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
                        className={`w-14 px-2 py-1 rounded-md text-sm text-center border focus:outline-none ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : ''}`}
                        style={{ borderColor: isDark ? undefined : '#3b82f6', color: isDark ? undefined : '#1f2937' }}
                      />
                    );
                  }

                  return (
                    <button
                      key={`${token}-${idx}`}
                      onClick={() => openEllipsisInput(token)}
                      title="Klik untuk lompat ke halaman tertentu"
                      className={`px-2 py-1 text-sm rounded-md transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      style={{ color: isDark ? undefined : '#9ca3af' }}
                    >
                      ...
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : ''}`}
                  style={{
                    backgroundColor: isDark ? undefined : '#f1f3f5',
                    color: isDark ? undefined : (currentPage === totalPages ? '#9ca3af' : '#4b5563'),
                    cursor: isDark ? undefined : (currentPage === totalPages ? 'default' : 'pointer'),
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {reviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReviewModal({ open: false, schedule: null })} />
          <div className={`relative rounded-xl shadow-2xl w-full max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`flex items-center justify-between px-6 py-4 border-b sticky top-0 rounded-t-xl ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
              <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Review Pembersihan</h2>
              <button onClick={() => setReviewModal({ open: false, schedule: null })} className={`p-1 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`} aria-label="Tutup">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className={`p-6 space-y-4 ${isDark ? 'text-gray-100' : ''}`}>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Kamar</p>
                <p className={`text-base font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>#{reviewModal.schedule?.no_kamar}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Judul</p>
                <p className={`text-base ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{reviewModal.schedule?.title}</p>
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Foto Dokumentasi Staff</p>
                {(() => {
                  const photos = parsePhotos(reviewModal.schedule?.photos);
                  if (photos.length === 0) return <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Tidak ada foto.</p>;
                  return (
                    <div className="flex flex-wrap gap-2">
                      {photos.map((photo, idx) => (
                        <img
                          key={idx}
                          src={`http://localhost:3000${photo}`}
                          alt={`Foto ${idx + 1}`}
                          className={`w-20 h-20 object-cover rounded-lg border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>Catatan Review (Opsional)</p>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                  placeholder="Berikan feedback untuk staff..."
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'border-gray-200'}`}
                  style={{ color: isDark ? undefined : '#1f2937' }}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewAction('approve')}
                  className={`flex-1 rounded-lg px-4 py-2.5 font-semibold text-white transition-colors ${
                    reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600/70 hover:bg-green-600'
                  }`}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction('reject')}
                  className={`flex-1 rounded-lg px-4 py-2.5 font-semibold text-white transition-colors ${
                    reviewAction === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-600/70 hover:bg-red-600'
                  }`}
                >
                  Disapprove
                </button>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModal({ open: false, schedule: null })}
                  className={`rounded-lg px-4 py-2.5 font-semibold transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleReviewSubmit}
                  disabled={submitting || !reviewAction}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-70 transition-colors"
                >
                  {submitting ? 'Menyimpan...' : 'Kirim Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusPembersihan;
