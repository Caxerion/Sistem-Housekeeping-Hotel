// src/pages/StatusKamar.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import EditButtonUniversal from '../components/editbuttonmodal/EditButtonUniversal';
import EditButtonStatusKamar from '../components/editbuttonmodal/EditButtonStatusKamar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const formatRupiah = (angka) => {
  if (!angka) return '-';
  return 'Rp ' + Number(angka).toLocaleString('id-ID');
};

const getFloor = (roomNumber) => {
  if (!roomNumber) return '-';
  return roomNumber.charAt(0);
};

const statusConfig = {
  available: { label: 'Available', lightBg: 'bg-green-100', lightColor: 'text-green-700', darkBg: 'bg-green-900/40', darkColor: 'text-green-300' },
  occupied: { label: 'Occupied', lightBg: 'bg-red-100', lightColor: 'text-red-700', darkBg: 'bg-red-900/40', darkColor: 'text-red-300' },
  maintenance: { label: 'Maintenance', lightBg: 'bg-yellow-100', lightColor: 'text-yellow-700', darkBg: 'bg-yellow-900/40', darkColor: 'text-yellow-300' },
  reserved: { label: 'Reserved', lightBg: 'bg-blue-100', lightColor: 'text-blue-700', darkBg: 'bg-blue-900/40', darkColor: 'text-blue-300' },
};

const housekeepingConfig = {
  clean: { label: "Clean", lightBg: "bg-green-100", lightColor: "text-green-700", darkBg: 'bg-green-900/40', darkColor: 'text-green-300' },
  dirty: { label: "Dirty", lightBg: "bg-red-100", lightColor: "text-red-700", darkBg: 'bg-red-900/40', darkColor: 'text-red-300' },
  cleaning: { label: "Cleaning", lightBg: "bg-yellow-100", lightColor: "text-yellow-700", darkBg: 'bg-yellow-900/40', darkColor: 'text-yellow-300' },
};

const StatusBadge = ({ status }) => {
  const { isDark } = useTheme();
  const config = statusConfig[status] || { label: status, lightBg: 'bg-gray-100', lightColor: 'text-gray-600', darkBg: 'bg-gray-700', darkColor: 'text-gray-400' };
  const bg = isDark ? config.darkBg : config.lightBg;
  const color = isDark ? config.darkColor : config.lightColor;
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${bg} ${color}`}
    >
      {config.label}
    </span>
  );
};

const HousekeepingBadge = ({ status }) => {
  const { isDark } = useTheme();
  const config = housekeepingConfig[status] || { label: status, lightBg: "bg-gray-100", lightColor: "text-gray-600", darkBg: 'bg-gray-700', darkColor: 'text-gray-400' };
  const bg = isDark ? config.darkBg : config.lightBg;
  const color = isDark ? config.darkColor : config.lightColor;
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase ${bg} ${color}`}
    >
      {config.label}
    </span>
  );
};

const buildPageTokens = (current, total) => {
  if (total <= 1) return [1];
  
  const delta = 1;
  const tokens = [];
  const rangeStart = Math.max(2, current - delta);
  const rangeEnd = Math.min(total - 1, current + delta);

  tokens.push(1);
  if (rangeStart > 2) tokens.push('ellipsis-left');
  for (let page = rangeStart; page <= rangeEnd; page++) tokens.push(page);
  if (rangeEnd < total - 1) tokens.push('ellipsis-right');
  if (total > 1) tokens.push(total);

  return tokens;
};

function StatusKamar() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [filter, setFilter] = useState('Semua');
  const [housekeepingFilter, setHousekeepingFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEllipsis, setEditingEllipsis] = useState(null);
  const [pageInput, setPageInput] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const itemsPerPage = 10;
  const filters = ['Semua', 'Available', 'Occupied', 'Maintenance', 'Reserved'];
  const housekeepingFilters = ['Semua', 'Clean', 'Dirty', 'Cleaning'];
  
  const canEditRoles = ['Super Admin', 'General Manager', 'Housekeeping Supervisor', 
                        'Front Office Staff', 'Front Office Manager'];
  const canEdit = canEditRoles.includes(user?.employee_position);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, typesRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/room-types')
        ]);
        setRooms(roomsRes.data.data || []);
        setRoomTypes(typesRes.data.data || []);
      } catch (err) {
        console.error('Gagal mengambil data kamar:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const eventSource = new EventSource(`http://localhost:3000/api/events?token=${token}`);

    const refresh = () => {
      api.get('/rooms').then(res => setRooms(res.data.data || [])).catch(console.error);
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
    eventSource.addEventListener('cleaning:canceled', refresh);
    eventSource.addEventListener('schedule:staffAssigned', refresh);
    eventSource.addEventListener('cleaning:staffAssigned', refresh);

    return () => {
      eventSource.close();
    };
  }, []);

  const handleEditClick = (room) => {
    if (room?.id) {
      setSelectedRoom(room);
      setIsModalOpen(true);
    }
  };

  const handleUpdateSuccess = (updatedRoom) => {
    if (!updatedRoom?.id) return;
    
    setRooms(prev => prev.map(room => 
      room.id === updatedRoom.id ? { ...room, ...updatedRoom } : room
    ));
    
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  const filteredRooms = rooms.filter(room => {
    const matchStatus = filter === 'Semua' || room.occupancy_status === filter.toLowerCase();
    const matchHousekeeping = housekeepingFilter === 'Semua' || room.housekeeping_status === housekeepingFilter.toLowerCase();
    const searchLower = search.toLowerCase();
    const matchSearch = room.room_number?.toLowerCase().includes(searchLower) ||
                        room.room_type?.toLowerCase().includes(searchLower);
    return matchStatus && matchHousekeeping && matchSearch;
  });

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRooms = filteredRooms.slice(startIndex, startIndex + itemsPerPage);
  const pageTokens = buildPageTokens(currentPage, totalPages);

  const openEllipsisInput = (token) => {
    setEditingEllipsis(token);
    setPageInput('');
  };

  const submitPageInput = () => {
    const target = parseInt(pageInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      setCurrentPage(target);
    }
    setEditingEllipsis(null);
    setPageInput('');
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') submitPageInput();
    else if (e.key === 'Escape') {
      setEditingEllipsis(null);
      setPageInput('');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-4">
      {/* Title */}
      <div className="p-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Status Kamar</h1>
      </div>

      <div className={`p-6 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-[#f9f9fa] border-[#e5e7eb]'}`}>
        {/* Filter & Search */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap items-center">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setCurrentPage(1); }}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
                style={{
                  backgroundColor: filter === f ? '#3b82f6' : '#f1f3f5',
                  color: filter === f ? '#ffffff' : '#4b5563',
                }}
              >
                {f}
              </button>
            ))}
            <select
              value={housekeepingFilter}
              onChange={(e) => { setHousekeepingFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 rounded-full text-sm font-medium border-0 outline-none focus:ring-0"
              style={{
                backgroundColor: housekeepingFilter !== 'Semua' ? '#3b82f6' : '#f1f3f5',
                color: housekeepingFilter !== 'Semua' ? '#ffffff' : '#4b5563',
              }}
            >
              {housekeepingFilters.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className={`flex items-center rounded-full px-3 py-1 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-[#e5e7eb]'}`} style={{ minWidth: '240px' }}>
            <i className={`fa-solid fa-magnifying-glass me-2 ${isDark ? 'text-gray-400' : ''}`} style={{ color: isDark ? undefined : '#9ca3af' }} />
            <input
              type="text"
              placeholder="Cari no. kamar..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className={`flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm ${isDark ? 'text-gray-100 placeholder-gray-400' : ''}`}
              style={{ color: isDark ? undefined : '#1f2937' }}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p className={isDark ? 'text-gray-400' : ''} style={{ color: isDark ? undefined : '#6b7280' }}>Memuat data kamar...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={isDark ? 'text-gray-400' : ''} style={{ color: isDark ? undefined : '#6b7280', fontSize: '0.85rem' }}>
                  <th className="text-left py-3 px-4 font-medium">No. Kamar</th>
                  <th className="text-left py-3 px-4 font-medium">Tipe Kamar</th>
                  <th className="text-left py-3 px-4 font-medium">Lantai</th>
                  <th className="text-left py-3 px-4 font-medium">Harga / Malam</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Housekeeping</th>
                  {canEdit && <th className="text-center py-3 px-4 font-medium">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedRooms.map((room) => (
                  <tr key={room.id} className={isDark ? 'border-gray-700' : ''} style={{ borderColor: isDark ? undefined : '#e5e7eb' }}>
                    <td className={`py-3 px-4 border-b font-semibold ${isDark ? 'text-gray-100' : ''}`} style={{ borderColor: isDark ? undefined : '#e5e7eb', color: isDark ? undefined : '#111827' }}>
                      {room.room_number}
                    </td>
                    <td className={`py-3 px-4 border-b ${isDark ? 'text-gray-300' : ''}`} style={{ borderColor: isDark ? undefined : '#e5e7eb', color: isDark ? undefined : '#6b7280' }}>
                      {room.room_type}
                    </td>
                    <td className={`py-3 px-4 border-b ${isDark ? 'text-gray-300' : ''}`} style={{ borderColor: isDark ? undefined : '#e5e7eb', color: isDark ? undefined : '#6b7280' }}>
                      {getFloor(room.room_number)}
                    </td>
                    <td className={`py-3 px-4 border-b ${isDark ? 'text-gray-300' : ''}`} style={{ borderColor: isDark ? undefined : '#e5e7eb', color: isDark ? undefined : '#6b7280' }}>
                      {formatRupiah(room.base_price)}
                    </td>
                    <td className={`py-3 px-4 border-b ${isDark ? 'text-gray-300' : ''}`} style={{ borderColor: isDark ? undefined : '#e5e7eb' }}>
                      <StatusBadge status={room.occupancy_status} />
                    </td>
                    <td className={`py-3 px-4 border-b ${isDark ? 'text-gray-300' : ''}`} style={{ borderColor: isDark ? undefined : '#e5e7eb' }}>
                      <HousekeepingBadge status={room.housekeeping_status} />
                    </td>
                    {canEdit && (
                      <td className={`py-3 px-4 border-b text-center ${isDark ? 'text-gray-300' : ''}`} style={{ borderColor: isDark ? undefined : '#e5e7eb' }}>
                        <EditButtonUniversal
                          onClick={() => handleEditClick(room)}
                          label="Edit"
                          size="sm"
                          variant="outline"
                        />
                      </td>
                    )}
                  </tr>
                ))}
                {paginatedRooms.length === 0 && (
                  <tr>
                    <td colSpan={canEdit ? 7 : 6} className={`text-center py-4 ${isDark ? 'text-gray-500' : ''}`} style={{ color: isDark ? undefined : '#9ca3af' }}>
                      Tidak ada kamar yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
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
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
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

      {/* Modal */}
      <EditButtonStatusKamar
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRoom(null);
        }}
        roomData={selectedRoom}
        onSuccess={handleUpdateSuccess}
        roomTypes={roomTypes}
      />
    </div>
  );
}

export default StatusKamar;
