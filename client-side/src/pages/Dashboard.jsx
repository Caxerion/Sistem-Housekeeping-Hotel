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

function StatCard({ value, label, colorClass }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function Dashboard() {
  const [now, setNow] = useState(new Date());
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
    sedangMaintenance: 0,
    staffHadirHariIni: 0,
  };

  const statsCards = [
    { value: statsData.totalKamar, label: 'Total Kamar', colorClass: 'text-blue-600' },
    { value: statsData.available, label: 'Available', colorClass: 'text-green-600' },
    { value: statsData.sedangMaintenance, label: 'Jumlah Kamar Maintenance', colorClass: 'text-amber-500' },
    { value: statsData.staffHadirHariIni, label: 'Staff Aktif Hari Ini', colorClass: 'text-purple-500' },
  ];

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((stat) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              label={stat.label}
              colorClass={stat.colorClass}
            />
          ))}
        </div>
      )}

      {/* konten dashboard lainnya di sini */}
    </div>
  );
}

export default Dashboard;