// src/pages/StatusKamar.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import EditButtonUniversal from '../components/editbuttonmodal/EditButtonUniversal';
import EditButtonStatusKamar from '../components/editbuttonmodal/EditButtonStatusKamar';
import { useAuth } from '../context/AuthContext';

const formatRupiah = (angka) => {
  if (!angka) return '-';
  return 'Rp ' + Number(angka).toLocaleString('id-ID');
};

const getFloor = (roomNumber) => {
  if (!roomNumber) return '-';
  return roomNumber.charAt(0);
};

const statusConfig = {
  available: { label: 'Available', bg: '#dcfce7', color: '#16a34a' },
  occupied: { label: 'Occupied', bg: '#fee2e2', color: '#dc2626' },
  maintenance: { label: 'Maintenance', bg: '#fef3c7', color: '#d97706' },
  reserved: { label: 'Reserved', bg: '#dbeafe', color: '#2563eb' },
};

const housekeepingConfig = {
  clean: { label: "Clean", bg: "#dcfce7", color: "#16a34a" },
  dirty: { label: "Dirty", bg: "#fee2e2", color: "#dc2626" },
  cleaning: { label: "Cleaning", bg: "#fef3c7", color: "#d97706" },
};

const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || { label: status, bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
};

const HousekeepingBadge = ({ status }) => {
  const config = housekeepingConfig[status] || { label: status, bg: "#f3f4f6", color: "#6b7280" };
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase"
      style={{ backgroundColor: config.bg, color: config.color }}
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
  
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [filter, setFilter] = useState('Semua');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEllipsis, setEditingEllipsis] = useState(null);
  const [pageInput, setPageInput] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const itemsPerPage = 10;
  const filters = ['Semua', 'Available', 'Occupied', 'Maintenance', 'Reserved'];
  
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
    const searchLower = search.toLowerCase();
    const matchSearch = room.room_number?.toLowerCase().includes(searchLower) ||
                        room.room_type?.toLowerCase().includes(searchLower);
    return matchStatus && matchSearch;
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
        <h1 className="text-2xl font-bold text-gray-800">Status Kamar</h1>
      </div>

      <div className="p-6 rounded-xl border" style={{ backgroundColor: '#f9f9fa', borderColor: '#e5e7eb' }}>
        {/* Filter & Search */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
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
          </div>

          <div className="flex items-center rounded-full px-3 py-1 border bg-white min-w-[240px]" style={{ borderColor: '#e5e7eb' }}>
            <i className="fa-solid fa-magnifying-glass me-2" style={{ color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Cari no. kamar..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm"
              style={{ color: '#1f2937' }}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ color: '#6b7280' }}>Memuat data kamar...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: '#6b7280', fontSize: '0.85rem' }}>
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
                  <tr key={room.id} style={{ borderColor: '#e5e7eb' }}>
                    <td className="py-3 px-4 border-b font-semibold" style={{ color: '#111827' }}>
                      {room.room_number}
                    </td>
                    <td className="py-3 px-4 border-b" style={{ color: '#6b7280' }}>
                      {room.room_type}
                    </td>
                    <td className="py-3 px-4 border-b" style={{ color: '#6b7280' }}>
                      {getFloor(room.room_number)}
                    </td>
                    <td className="py-3 px-4 border-b" style={{ color: '#6b7280' }}>
                      {formatRupiah(room.base_price)}
                    </td>
                    <td className="py-3 px-4 border-b">
                      <StatusBadge status={room.occupancy_status} />
                    </td>
                    <td className="py-3 px-4 border-b">
                      <HousekeepingBadge status={room.housekeeping_status} />
                    </td>
                    {canEdit && (
                      <td className="py-3 px-4 border-b text-center">
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
                    <td colSpan={canEdit ? 7 : 6} className="text-center py-4" style={{ color: '#9ca3af' }}>
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
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
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