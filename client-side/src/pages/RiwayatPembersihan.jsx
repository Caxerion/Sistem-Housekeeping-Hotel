import { useState, useEffect } from 'react';
import api from '../services/api';

const dummyDatabase = [
  {
    id: 1,
    room_number: '101',
    room_type: 'Deluxe Room',
    employee_name: 'Budi Santoso',
    action_note: 'Ganti seprei, sedot debu, isi ulang sabun & sampo mandi.',
    cleaned_at: '2026-08-03T09:30:00Z',
  },
  {
    id: 2,
    room_number: '102',
    room_type: 'Standard Room',
    employee_name: 'Siti Rahma',
    action_note: 'Pembersihan rutin, sanitasi gagang pintu dan remote TV.',
    cleaned_at: '2026-08-03T10:15:00Z',
  },
  {
    id: 3,
    room_number: '201',
    room_type: 'Suite Room',
    employee_name: 'Budi Santoso',
    action_note: 'Ganti handuk mandi, pel lantai, semprot cairan disinfektan.',
    cleaned_at: '2026-08-03T11:00:00Z',
  },
  {
    id: 4,
    room_number: '105',
    room_type: 'Standard Room',
    employee_name: 'Ahmad Fauzi',
    action_note: 'Restock perlengkapan toiletries & perbaiki posisi cermin.',
    cleaned_at: '2026-08-02T15:45:00Z',
  },
];

function RiwayatPembersihan() {
  const [logs, setLogs] = useState(dummyDatabase);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  //Hapus dummyDatabase dan aktifin useEffect yg di bawah
  /*
  useEffect(() => {
    const fetchCleaningHistory = async () => {
      try {
        const res = await api.get('/maintenance/history');
        setLogs(res.data.data || res.data);
      } catch (err) {
        console.error('Gagal mengambil riwayat pembersihan:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCleaningHistory();
  }, []);
  */

  // Filter log berdasarkan nomor kamar, nama petugas, atau catatan
  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    return (
      log.room_number.toLowerCase().includes(query) ||
      log.employee_name.toLowerCase().includes(query) ||
      (log.action_note && log.action_note.toLowerCase().includes(query))
    );
  });

  // Helper untuk format tanggal dan waktu
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';
  };

  return (
    <div className="p-6">
      {/* Title Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Riwayat Pembersihan</h1>
          <p className="text-sm text-gray-500 mt-1">
            Catatan log pekerjaan kebersihan kamar oleh tim Housekeeping
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow p-4 mb-6">
        <input
          type="text"
          placeholder="Cari nomor kamar, nama petugas, atau catatan..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Logs List Container */}
      <p className="text-lg font-light text-gray-400 mb-2">Daftar Aktivitas Log</p>

      {loading ? (
        <p className="text-gray-400">Memuat riwayat pembersihan...</p>
      ) : (
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400 text-sm">
              Tidak ada riwayat pembersihan yang ditemukan.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-2xl shadow p-5 transition-all"
              >
                {/* Top Section: Room & Date */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-xl text-sm">
                      Kamar {log.room_number}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {log.room_type || 'Kamar'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    🕒 {formatDateTime(log.cleaned_at)}
                  </span>
                </div>

                {/* Bottom Section: Employee & Action Note */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Petugas:</span>
                    <span className="font-semibold text-gray-700">
                      {log.employee_name}
                    </span>
                  </div>

                  {log.action_note && (
                    <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 mt-2">
                      <span className="font-semibold text-gray-500 block mb-1">
                        Catatan Pekerjaan:
                      </span>
                      {log.action_note}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default RiwayatPembersihan;