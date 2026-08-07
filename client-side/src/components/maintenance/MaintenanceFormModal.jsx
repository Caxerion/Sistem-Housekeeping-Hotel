function MaintenanceFormModal({
  isModalOpen,
  closeModal,
  form,
  setForm,
  rooms,
  staffList,
  staffDropdownOpen,
  setStaffDropdownOpen,
  staffDropdownRef,
  toggleStaff,
  handleSubmit,
  submitting,
}) {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
  );
}

export default MaintenanceFormModal;
