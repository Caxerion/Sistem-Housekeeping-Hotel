import { useState, useEffect } from 'react';
import api from '../services/api';

function RiwayatPembersihan() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCleaningHistory = async () => {
      try {
        const res = await api.get('/maintenance/history');
        setLogs(res.data.data || []);
      } catch (err) {
        console.error('Gagal mengambil riwayat pembersihan:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCleaningHistory();
  }, []);

  //Fungsi menghapus riwayat pembersihan
  const handleDeleteAll = async () => {
    const confirmDelete = window.confirm("Apakah ingin menghapus seluruh Riwayat? Tindakan ini tidak dapat dibatalkan");

    if (!confirmDelete) return;

    try {
      await api.delete('/maintenance/history');

      setLogs([]);
      alert("Seluruh riwayat berhasil dihapus");
    } catch (err) {
      console.log('Gagal menghapus riwayat pembersihan', err);
      alert("Gagal menghapus riwayat. Silahkan coba lagi");
    }
  };

  // Filter log berdasarkan nomor kamar, nama petugas, atau catatan
  const filteredLogs = logs.filter((log) => {
    const query = searchQuery.toLowerCase();
    return (
      log.room_number?.toLowerCase().includes(query) ||
      log.employee_name?.toLowerCase().includes(query) ||
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
      <div className="flex items-center justify-between mb-6">
        <p className="text-lg font-light text-gray-400">Daftar Aktivitas Log</p>
        <div className="flex justify-end">
          <button
            onClick={handleDeleteAll}
            disabled={logs.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm
              ${logs.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 border border-red-200'
              }`}
          >
            <i className="fa-regular fa-trash-can text-base"></i>
            Hapus Semua Riwayat
          </button>
        </div>
      </div>

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
                    <i class="fa-regular fa-clock"></i> {formatDateTime(log.cleaned_at)}
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