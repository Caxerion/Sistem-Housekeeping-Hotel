function InProgressTaskCard({ task, myEmployeeId, uploading, fileInputRefs, onUploadPhotos, onComplete, onCancel, parsePhotos, getTimeAgo, minPhotos, showCancel = false, completeButtonText = 'Selesaikan', cancelButtonText = 'Batalkan Pembersihan' }) {
  const photos = parsePhotos(task.photos);
  const staffNames = Array.isArray(task.assigned_staff) ? task.assigned_staff : [];
  const staffIds = Array.isArray(task.assigned_staff_ids) ? task.assigned_staff_ids : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl font-bold text-gray-800">#{task.no_kamar}</span>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase bg-blue-100 text-blue-700">
                {task.title}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Dimulai {getTimeAgo(task.started_at)}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Petugas</p>
          <div className="flex flex-wrap gap-2">
            {staffNames.map((name, idx) => {
              const isMe = staffIds[idx] === myEmployeeId;
              return (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    isMe
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isMe ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  ></span>
                  {name}
                  {isMe && <span className="text-[10px]">(Anda)</span>}
                </span>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Foto Dokumentasi ({photos.length}/{minPhotos} minimal)
          </p>

          {photos.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {photos.map((photo, idx) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
                >
                  <img
                    src={`http://localhost:3000${photo}`}
                    alt={`Foto ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
                              ref={(el) => {
                                if (!fileInputRefs.current[task.schedule_id]) {
                                  // eslint-disable-next-line react-hooks/immutability
                                  fileInputRefs.current[task.schedule_id] = {};
                                }
                                fileInputRefs.current[task.schedule_id].upload = el;
                              }}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                if (e.target.files.length > 0) {
                  onUploadPhotos(task.schedule_id, e.target.files);
                  e.target.value = '';
                }
              }}
              className="hidden"
            />
            <button
              onClick={() => fileInputRefs.current[task.schedule_id]?.upload?.click()}
              disabled={uploading[task.schedule_id]}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
            >
              <i className="fa-solid fa-camera"></i>
              {uploading[task.schedule_id] ? 'Mengupload...' : photos.length === 0 ? 'Upload Foto' : 'Tambah Foto'}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={() => onComplete(task.schedule_id, photos)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            <i className="fa-solid fa-check"></i>
            {completeButtonText}
          </button>
          {showCancel && onCancel && (
            <button
              onClick={() => onCancel(task.schedule_id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <i className="fa-solid fa-xmark"></i>
              {cancelButtonText}
            </button>
          )}
          <span className="text-xs text-gray-400">
            {photos.length < minPhotos
              ? `Upload ${minPhotos - photos.length} foto lagi untuk bisa menyelesaikan.`
              : 'Siap diselesaikan.'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default InProgressTaskCard;
