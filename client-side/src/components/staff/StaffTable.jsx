import StatusBadge from './StatusBadge';

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

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function StaffToolbar({ user, navigate, searchQuery, setSearchQuery, statusFilter, setStatusFilter }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
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

          {user?.current_role === 'staff' && (
            <button
              onClick={() => navigate(`/absensi-logs?employee_id=${user.employee_id}`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shrink-0"
            >
              <EyeIcon />
              Log Absensi Saya
            </button>
          )}
        </div>

        {user?.current_role === 'admin' && (
          <button
            onClick={() => navigate('/absensi-logs')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shrink-0"
          >
            {/* <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg> */}
            <EyeIcon />
            Log Absensi Staff
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
    </>
  );
}

function StaffTable({ staffList, loading, error, searchQuery, statusFilter }) {
  const filteredStaffList = staffList.filter((staff) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      staff.full_name?.toLowerCase().includes(query) ||
      staff.position?.toLowerCase().includes(query) ||
      staff.phone?.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'semua' || staff.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
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
    </>
  );
}

export { StaffToolbar, StaffTable };
