import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { StatusBadge, HousekeepingBadge } from '../components/maintenance/MaintenanceBadges';

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
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEllipsis, setEditingEllipsis] = useState(null);
  const [pageInput, setPageInput] = useState('');
  const [now, setNow] = useState(0);
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSchedules();
  }, [fetchSchedules]);

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
          schedule_id: null,
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
        <h1 className="text-2xl font-bold text-gray-800">Status Pembersihan</h1>
        <p className="text-gray-500 mt-2">Daftar status pembersihan kamar beserta jadwal dan petugas yang ditugaskan.</p>
      </div>

      <div className="p-6 rounded-xl border" style={{ backgroundColor: '#f9f9fa', borderColor: '#e5e7eb' }}>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Daftar Status Pembersihan</h2>

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
                               placeholder="Cari no. kamar / tipe / petugas..."
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
                  <th className="text-left py-3 px-4 font-medium">No</th>
                  <th className="text-left py-3 px-4 font-medium">Nama Kamar</th>
                  <th className="text-left py-3 px-4 font-medium">Tipe Kamar</th>
                  <th className="text-left py-3 px-4 font-medium">Tanggal</th>
                  <th className="text-left py-3 px-4 font-medium">Petugas</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSchedules.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4" style={{ color: '#9ca3af' }}>
                      {search.trim() ? 'Tidak ada jadwal yang cocok.' : 'Belum ada jadwal pembersihan.'}
                    </td>
                  </tr>
                ) : (
                  paginatedSchedules.map((schedule, idx) => (
                    <tr key={schedule.schedule_id ?? `empty-${schedule.room_id}-${idx}`} style={{ borderColor: '#e5e7eb' }}>
                      <td
                        className="py-3 px-4 border-b"
                        style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                      >
                        {startIndex + idx + 1}
                      </td>
                      <td
                        className="py-3 px-4 border-b font-semibold"
                        style={{ borderColor: '#e5e7eb', color: '#111827' }}
                      >
                        {schedule.no_kamar}
                      </td>
                      <td
                        className="py-3 px-4 border-b"
                        style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                      >
                        {schedule.room_type || '-'}
                      </td>
                      <td
                        className="py-3 px-4 border-b"
                        style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                      >
                        {schedule.scheduled_date || '-'}
                      </td>
                      <td className="py-3 px-4 border-b" style={{ borderColor: '#e5e7eb' }}>
                        {Array.isArray(schedule.assigned_staff) && schedule.assigned_staff.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {schedule.assigned_staff.map((name, i) => (
                              <span
                                key={i}
                                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 border-b" style={{ borderColor: '#e5e7eb' }}>
                        {schedule.schedule_id ? (
                          <StatusBadge status={getDisplayStatus(schedule)} />
                        ) : (
                          <HousekeepingBadge status={getDisplayStatus(schedule)} />
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
};

export default StatusPembersihan;
