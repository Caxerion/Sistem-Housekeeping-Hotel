import { EyeIcon, StatusBadge } from './helpers';

function StaffCard({ staff, onViewLogs }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 sm:p-5 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-xl text-sm break-words">
            {staff.full_name}
          </span>
          <span className="text-xs text-gray-400 font-medium">
            {staff.position || '-'}
          </span>
        </div>
        <StatusBadge status={staff.status} />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">No. Handphone:</span>
          <span className="font-semibold text-gray-700">{staff.phone || '-'}</span>
        </div>
        <button
          onClick={() => onViewLogs(staff)}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all"
        >
          <EyeIcon />
          Lihat Log Absensi
        </button>
      </div>
    </div>
  );
}

export default StaffCard;
