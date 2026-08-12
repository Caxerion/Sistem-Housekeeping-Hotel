import { EyeIcon, ClockIcon, StatusBadge, formatDate, formatTime, statusColor } from './helpers';

function LogCard({ log, onViewPhotos }) {
  const barColor = statusColor[log.status]?.bar || '#d1d5db';

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden flex"
      style={{ borderLeft: `4px solid ${barColor}` }}
    >
      <div className="p-4 sm:p-5 flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-800 text-sm">
              {formatDate(log.check_in_at)}
            </span>
            <StatusBadge status={log.status} />
          </div>
          {log.status === 'izin' ? (
            <span className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
              <ClockIcon />
              {formatDate(log.izin_start_at)} - {formatDate(log.izin_end_at)}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
              <ClockIcon />
              {formatTime(log.check_in_at)} - {formatTime(log.check_out_at)}
              {log.check_out_at && formatDate(log.check_out_at) !== formatDate(log.check_in_at) && (
                <span className="text-gray-500">({formatDate(log.check_out_at)})</span>
              )}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          {log.status === 'izin' ? (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 w-24 shrink-0">Mulai Izin</span>
                <span className="font-semibold text-gray-700">{formatDate(log.izin_start_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 w-24 shrink-0">Izin Sampai</span>
                <span className="font-semibold text-gray-700">{formatDate(log.izin_end_at)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 w-24 shrink-0">Check In</span>
                <span className="font-semibold text-gray-700">{formatTime(log.check_in_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 w-24 shrink-0">Check Out</span>
                <span className="font-semibold text-gray-700">{formatTime(log.check_out_at)}</span>
              </div>
            </>
          )}
        </div>

        {(log.izin_reason || log.notes) && (
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 mt-3 break-words">
            <span className="font-semibold text-gray-500 block mb-1">
              {log.status === 'izin' ? 'Alasan Izin:' : 'Catatan:'}
            </span>
            {log.status === 'izin' ? log.izin_reason : log.notes}
          </div>
        )}

        {Array.isArray(log.photos) && log.photos.length > 0 && (
          <div className="flex sm:justify-end pt-3">
            <button
              onClick={() => onViewPhotos(log)}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all"
            >
              <EyeIcon />
              Lihat Foto ({log.photos.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LogCard;
