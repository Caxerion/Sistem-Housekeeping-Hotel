import StaffPicker from './StaffPicker';

function CleaningModal({ isOpen, onClose, rooms, form, onFormChange, onSubmit, submitting, staffSelectMode, staff, user, selectedIds, onAddStaff, onRemoveStaff, housekeepingStaff }) {
  if (!isOpen) return null;

  const renderStaffField = () => {
    if (staffSelectMode === 'picker') {
      return (
        <div>
          <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Pilih Petugas</label>
          <StaffPicker
            staff={staff}
            user={user}
            selectedIds={selectedIds}
            onAddStaff={onAddStaff}
            onRemoveStaff={onRemoveStaff}
          />
        </div>
      );
    }

    if (staffSelectMode === 'disabled') {
      return (
        <div>
          <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Pilih Petugas</label>
          <div className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 bg-gray-50">
            {user?.full_name} (Anda)
          </div>
        </div>
      );
    }

    return (
      <div>
        <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Pilih Petugas</label>
        <select
          value={selectedIds}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, (option) => Number(option.value));
            onFormChange({ ...form, staff_ids: selected });
          }}
          multiple
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 h-32"
          required
        >
          {housekeepingStaff.map((s) => (
            <option key={s.employee_id} value={s.employee_id}>
              {s.full_name} - {s.position}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Lakukan Pembersihan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Tutup"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Pilih Kamar</label>
            <select
              value={form.room_id}
              onChange={(e) => onFormChange({ ...form, room_id: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
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
            <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Judul Pembersihan</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => onFormChange({ ...form, title: e.target.value })}
              placeholder="Contoh: Pembersihan Kamar Tamu"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              required
            />
          </div>
          {renderStaffField()}
          <div>
            <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Catatan</label>
            <textarea
              value={form.notes}
              onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
              placeholder="Opsional: informasi tambahan untuk petugas"
              rows="3"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 resize-none"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-70 transition-colors"
            >
              {submitting ? 'Menyimpan...' : 'Buat Tugas Pembersihan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-5 py-2.5 font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CleaningModal;
