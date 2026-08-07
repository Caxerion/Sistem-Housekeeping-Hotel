import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';

function IzinForm() {
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState(null);
  const [izinReason, setIzinReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await api.get('/attendance/today');
        setAttendance(res.data.data);
      } catch {
        setError('Gagal memuat data absensi.');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!izinReason.trim()) {
      setError('Alasan izin wajib diisi.');
      return;
    }

    if (!attendance) {
      setError('Tidak ada sesi absensi aktif.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/attendance/${attendance.id}/izin`, { reason: izinReason });
      Swal.fire({
        icon: 'success',
        title: 'Izin Tercatat!',
        text: 'Sampai ketemu besok lagi!',
        timer: 2000,
        showConfirmButton: false,
      }).then(() => navigate('/staff'));
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim izin.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-400 text-sm">Memuat...</div>;
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">Form Izin Absensi</h1>
      <p className="text-gray-500 mt-2">Ajukan izin absensi tanpa check-in atau check-out.</p>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        {attendance ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Nama</label>
              <input
                type="text"
                value={attendance.full_name || ''}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">No. Telepon</label>
              <input
                type="text"
                value={attendance.phone || ''}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
              />
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-700 mb-4">
            Anda belum melakukan absensi hari ini. Izin hanya dapat diajukan jika ada sesi absensi aktif.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Alasan Izin <span className="text-red-500">*</span>
            </label>
            <textarea
              value={izinReason}
              onChange={(e) => setIzinReason(e.target.value)}
              rows="3"
              placeholder="Contoh: Sakit, keperluan keluarga, dll."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !attendance}
              className="rounded-lg bg-amber-600 px-4 py-2.5 font-semibold text-white hover:bg-amber-700 disabled:opacity-70 transition-colors"
            >
              {submitting ? 'Mengirim...' : 'Kirim Izin'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/staff')}
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

export default IzinForm;
