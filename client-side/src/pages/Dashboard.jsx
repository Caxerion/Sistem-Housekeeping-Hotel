import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function getGreeting(date) {
  const hour = date.getHours();

  if (hour >= 0 && hour < 11) return 'Pagi';
  if (hour >= 11 && hour < 15) return 'Siang';
  if (hour >= 15 && hour < 18) return 'Sore';
  return 'Malam';
}

function Dashboard() {
  const [now, setNow] = useState(new Date());
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data.data);
      } catch (err) {
        console.error('Gagal mengambil stats dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const greeting = getGreeting(now);
  const formattedTime = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const statsData = stats || {
    totalKamar: 0,
    available: 0,
    dirty: 0,
    cleaning: 0,
    sedangMaintenance: 0,
    staffHadirHariIni: 0,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Selamat {greeting}, {user?.employee_name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Waktu Menunjukkan Pukul: {formattedTime} WIB</p>
      </div>

      <p className="text-lg font-light text-gray-400 mb-2">Dashboard Status</p>
      {loading ? (
        <p className="text-gray-400">Memuat data...</p>
      ) : (
        // items-start: mencegah card lain ikut "stretch" tinggi saat card Maintenance expand
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 items-start">
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="text-3xl font-bold text-blue-600">{statsData.totalKamar}</div>
            <div className="text-sm text-gray-500 mt-1">Total Kamar</div>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="text-3xl font-bold text-green-600">{statsData.available}</div>
            <div className="text-sm text-gray-500 mt-1">Kamar Available</div>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="text-3xl font-bold text-purple-500">{statsData.staffHadirHariIni}</div>
            <div className="text-sm text-gray-500 mt-1">Jumlah Staff Aktif</div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <button
              type="button"
              onClick={() => setMaintenanceOpen((prev) => !prev)}
              className="w-full flex items-center justify-between"
            >
              <div className="text-left">
                <div className={`text-3xl font-bold ${statsData.sedangMaintenance > 0 ? 'text-amber-500' : 'text-orange-400'}`}>
                  {statsData.sedangMaintenance}
                </div>
                <div className="text-sm text-gray-500 mt-1">Jumlah Kamar Maintenance</div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${maintenanceOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                maintenanceOpen ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Sedang Cleaning</span>
                  <span className={`font-semibold ${statsData.cleaning > 0 ? 'text-cyan-600' : 'text-gray-400'}`}>
                    {statsData.cleaning}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Kamar Dirty</span>
                  <span className={`font-semibold ${statsData.dirty > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {statsData.dirty}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* konten dashboard lainnya di sini */}
    </div>
  );
}

export default Dashboard;