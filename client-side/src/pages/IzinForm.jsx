/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';

function IzinForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [izinReason, setIzinReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    setStartDate(today);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    setEndDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const handleStartDateChange = (e) => {
    const val = e.target.value;
    setStartDate(val);
    if (val && !endDate) {
      const d = new Date(val);
      d.setDate(d.getDate() + 1);
      setEndDate(d.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!izinReason.trim()) {
      setError('Alasan izin wajib diisi.');
      return;
    }

    if (!startDate) {
      setError('Tanggal mulai izin wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/attendance/izin-direct', {
        reason: izinReason,
        start_date: startDate,
        end_date: endDate || null,
      });
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

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800">Form Izin Absensi</h1>
      <p className="text-gray-500 mt-2">Ajukan izin absensi tanpa check-in atau check-out.</p>

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Nama</label>
              <input
                type="text"
                value={user?.employee_name || ''}
                disabled
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
              />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">No. Telepon</label>
            <input
              type="text"
              value={user?.phone || ''}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Mulai Izin <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Izin Sampai
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
          </div>

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
              disabled={submitting}
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
