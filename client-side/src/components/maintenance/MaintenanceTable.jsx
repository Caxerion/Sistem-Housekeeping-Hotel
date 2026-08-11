import { StatusBadge } from './MaintenanceBadges';

function formatDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

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

function MaintenanceTable({
  loading,
  paginatedSchedules,
  search,
  setSearch,
  currentPage,
  setCurrentPage,
  editingEllipsis,
  pageInput,
  setPageInput,
  handlePageInputKeyDown,
  submitPageInput,
  user,
  handleStart,
  handleComplete,
  handleCancel,
  totalPages,
  openEllipsisInput,
}) {
  const pageTokens = buildPageTokens(currentPage, totalPages);

  return (
    <div className="p-6 rounded-xl border" style={{ backgroundColor: '#f9f9fa', borderColor: '#e5e7eb' }}>
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
            placeholder="Cari no. kamar / judul..."
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
                <th className="text-left py-3 px-4 font-medium">Tanggal Mulai</th>
                <th className="text-left py-3 px-4 font-medium">Tanggal Selesai</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSchedules.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4" style={{ color: '#9ca3af' }}>
                    {search.trim() ? 'Tidak ada jadwal yang cocok.' : 'Belum ada jadwal maintenance.'}
                  </td>
                </tr>
              ) : (
                paginatedSchedules.map((sched, idx) => (
                  <tr key={sched.schedule_id ?? `empty-${sched.room_id}-${idx}`} style={{ borderColor: '#e5e7eb' }}>
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
                       {formatDate(sched.scheduled_date) || '-'}
                     </td>
                     <td
                       className="py-3 px-4 border-b"
                       style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
                     >
                       {formatDate(sched.ended_at) || '-'}
                     </td>
                    <td className="py-3 px-4 border-b" style={{ borderColor: '#e5e7eb' }}>
                      <StatusBadge status={sched.status} />
                    </td>
                    <td className="py-3 px-4 border-b" style={{ borderColor: '#e5e7eb' }}>
                      <div className="flex gap-2">
                        {sched.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => handleStart(sched.schedule_id)}
                              className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                              Mulai
                            </button>
                            <button
                              onClick={() => handleCancel(sched.schedule_id)}
                              className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                            >
                              Batal
                            </button>
                          </>
                        )}
                        {sched.status === 'in_progress' && (
                          <>
                            <button
                              onClick={() => handleComplete(sched.schedule_id)}
                              className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                            >
                              Selesai
                            </button>
                            <button
                              onClick={() => handleCancel(sched.schedule_id)}
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
  );
}

export default MaintenanceTable;
