import { useState } from 'react';

function StaffPicker({ staff, user, selectedIds, onAddStaff, onRemoveStaff }) {
  const [showPicker, setShowPicker] = useState(false);

  const myId = Number(user?.employee_id);
  const selectedStaff = staff.filter((p) => selectedIds.includes(Number(p.employee_id)));
  const eligibleAdditional = staff.filter(
    (person) =>
      Number(person.employee_id) !== myId &&
      !selectedIds.includes(Number(person.employee_id)) &&
      (person.attendance_status === 'standby' || person.attendance_status === 'active_today')
  );

  const myStaff = selectedStaff.find((p) => Number(p.employee_id) === myId);
  const otherStaff = selectedStaff.filter((p) => Number(p.employee_id) !== myId);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {myStaff && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
            {myStaff.full_name} (Anda)
            <span className="text-[10px] opacity-70">host</span>
          </span>
        )}
        {otherStaff.map((person) => (
          <span
            key={person.employee_id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
          >
            {person.full_name}
            <button
              type="button"
              onClick={() => onRemoveStaff(person.employee_id)}
              className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <i className="fa-solid fa-xmark text-[10px]"></i>
            </button>
          </span>
        ))}
        {selectedIds.length === 0 && (
          <span className="text-xs text-gray-400">Belum ada petugas dipilih.</span>
        )}
      </div>
      {eligibleAdditional.length > 0 ? (
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPicker((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <i className="fa-solid fa-plus"></i>
            Tambah Petugas
          </button>
          {showPicker && (
            <div className="absolute z-10 mt-1 w-full max-w-xs bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {eligibleAdditional.map((person) => (
                <button
                  key={person.employee_id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onAddStaff(person.employee_id);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center justify-between"
                >
                  <span>
                    {person.full_name}
                    <span className="text-[10px] text-gray-400 ml-1">{person.position}</span>
                  </span>
                  <span className="text-[10px] text-gray-400">{person.attendance_status === 'standby' ? 'Standby' : 'Aktif'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        selectedIds.length > 0 && (
          <p className="text-[11px] text-gray-400">Semua petugas standby/aktif sudah ditambahkan.</p>
        )
      )}
    </div>
  );
}

export default StaffPicker;
