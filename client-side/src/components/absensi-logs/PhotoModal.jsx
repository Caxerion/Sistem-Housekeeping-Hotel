import { formatDate } from './helpers';

function PhotoModal({ selectedLog, photoModalOpen, closePhotoModal }) {
  if (!photoModalOpen || !selectedLog) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={closePhotoModal}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 break-words">
            Foto Absensi - {formatDate(selectedLog.check_in_at)}
          </h3>
          <button
            onClick={closePhotoModal}
            className="text-gray-400 hover:text-gray-600 p-1 shrink-0"
            aria-label="Tutup"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 sm:p-6">
          {Array.isArray(selectedLog.photos) && selectedLog.photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {selectedLog.photos.map((photo, idx) => (
                <div key={idx} className="rounded-lg overflow-hidden border border-gray-200 aspect-square">
                  <img
                    src={photo}
                    alt={`Foto absensi ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-8">Tidak ada foto untuk absensi ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PhotoModal;
