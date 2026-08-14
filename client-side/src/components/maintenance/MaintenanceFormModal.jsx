import { useTheme } from '../../context/ThemeContext';

function MaintenanceFormModal({
  isModalOpen,
  closeModal,
  form,
  setForm,
  rooms,
  handleSubmit,
  submitting,
}) {
  const { isDark } = useTheme();
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
      <div className={`relative rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`flex items-center justify-between px-6 py-4 border-b sticky top-0 rounded-t-xl ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Buat Jadwal Maintenance</h2>
          <button
            onClick={closeModal}
            className={`p-1 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
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
            <label className={`block text-left text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Kamar
            </label>
            <select
              value={form.room_id}
              onChange={(e) => setForm({ ...form, room_id: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border-gray-200'}`}
              style={{ color: isDark ? undefined : '#1f2937' }}
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
            <label className={`block text-left text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Judul Maintenance
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Contoh: Perawatan AC berkala"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'border-gray-200'}`}
              style={{ color: isDark ? undefined : '#1f2937' }}
              required
            />
          </div>

          <div>
            <label className={`block text-left text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Tanggal Maintenance
            </label>
            <input
              type="date"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border-gray-200'}`}
              style={{ color: isDark ? undefined : '#1f2937' }}
              required
            />
          </div>

          <div>
            <label className={`block text-left text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Selesai Maintenance
            </label>
            <input
              type="date"
              value={form.ended_at}
              onChange={(e) => setForm({ ...form, ended_at: e.target.value })}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border-gray-200'}`}
              style={{ color: isDark ? undefined : '#1f2937' }}
            />
          </div>

          <div className="md:col-span-2">
            <label className={`block text-left text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Catatan
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Catatan tambahan (opsional)"
              rows="2"
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'border-gray-200'}`}
              style={{ color: isDark ? undefined : '#1f2937' }}
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
            <label htmlFor="setImmediately" className={`text-sm cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
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
              className={`rounded-lg px-4 py-2.5 font-semibold transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MaintenanceFormModal;
