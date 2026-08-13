import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';

const MIN_PHOTOS = 3;

function EndAttendance() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasInProgressTask, setHasInProgressTask] = useState(false);

  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]); // File[]
  const [photoPreviews, setPhotoPreviews] = useState([]); // string[]
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const [attendanceRes, cleaningRes, maintenanceRes] = await Promise.all([
          api.get('/attendance/today'),
          api.get('/cleaning-schedule/my-schedule').catch(() => ({ data: { data: [] } })),
          api.get('/room-schedule/my-schedule').catch(() => ({ data: { data: [] } })),
        ]);
        
        if (attendanceRes.data.data && String(attendanceRes.data.data.id) === String(id)) {
          setAttendance(attendanceRes.data.data);
        } else {
          setError('Sesi absensi ini tidak ditemukan atau bukan milik Anda.');
        }

        const cleaningTasks = cleaningRes.data.data || [];
        const maintenanceTasks = maintenanceRes.data.data || [];
        const inProgressCleaning = cleaningTasks.filter(t => t.status === 'in_progress');
        const inProgressMaintenance = maintenanceTasks.filter(t => t.status === 'in_progress');
        const totalInProgress = inProgressCleaning.length + inProgressMaintenance.length;
        
        if (totalInProgress > 0) {
          setHasInProgressTask(true);
        }
      } catch {
        setError('Gagal memuat data absensi.');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [id]);

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPhotos = [...photos, ...files];
    setPhotos(newPhotos);

    const newPreviews = [
      ...photoPreviews,
      ...files.map((file) => URL.createObjectURL(file)),
    ];
    setPhotoPreviews(newPreviews);

    e.target.value = '';
  };

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    const newPreviews = photoPreviews.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviews(newPreviews);
  };

  useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!notes.trim()) {
      setError('Catatan wajib diisi.');
      return;
    }
    if (photos.length < MIN_PHOTOS) {
      setError(`Upload minimal ${MIN_PHOTOS} foto (saat ini: ${photos.length}).`);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('notes', notes);
      photos.forEach((file) => formData.append('photos', file));

      await api.post(`/attendance/${id}/check-out`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Swal.fire({
        icon: 'success',
        title: 'Absensi Tercatat!',
        text: 'Sampai ketemu besok lagi!',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => navigate('/staff'));
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengakhiri absensi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndAttendanceClick = () => {
    if (hasInProgressTask) {
      Swal.fire({
        icon: 'warning',
        title: 'Penugasan Belum Selesai',
        text: 'Anda masih memiliki penugasan pembersihan/maintenance yang sedang berjalan. Selesaikan penugasan terlebih dahulu sebelum mengakhiri absensi.',
        confirmButtonText: 'Mengerti',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-400 text-sm">Memuat...</div>;
  }

  if (error && !attendance) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">Akhiri Absensi</h1>
      <p className="text-gray-500 mt-2">Lengkapi data di bawah untuk mengakhiri sesi absensi Anda.</p>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Nama</label>
            <input
              type="text"
              value={attendance?.full_name || ''}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">No. Telepon</label>
            <input
              type="text"
              value={attendance?.phone || ''}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Catatan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Ringkasan pekerjaan hari ini..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Upload Foto (minimal {MIN_PHOTOS}) <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              multiple
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
            >
              + Tambah Foto
            </button>
            <p className="text-xs text-gray-400 mt-1">
              {photos.length} foto dipilih. Minimum {MIN_PHOTOS} foto.
            </p>

            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {photoPreviews.map((preview, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(idx)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Hapus foto"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={hasInProgressTask ? handleEndAttendanceClick : handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-70 transition-colors"
            >
              {submitting ? 'Menyimpan...' : hasInProgressTask ? 'Selesaikan Penugasan Terlebih Dahulu' : 'Selesaikan Absensi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EndAttendance;
