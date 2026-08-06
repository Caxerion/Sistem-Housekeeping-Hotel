import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/* eslint-disable react-hooks/set-state-in-effect */

function getGreeting(date) {
  const hour = date.getHours();

  if (hour >= 0 && hour < 11) return 'Pagi';
  if (hour >= 11 && hour < 15) return 'Siang';
  if (hour >= 15 && hour < 18) return 'Sore';
  return 'Malam';
}

// '2026-07-28' -> '28 Jul'
function formatShortDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

function Dashboard() {
  const [now, setNow] = useState(new Date());
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);

  const [trend, setTrend] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [windowOffset, setWindowOffset] = useState(0);
  const [trendPeriod, setTrendPeriod] = useState('');

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

  const fetchTrend = useCallback(async () => {
    setTrendLoading(true);
    try {
      const res = await api.get('/dashboard/maintenance-trend', {
        params: { days: 14, offset: windowOffset },
      });
      setTrend(res.data.data || []);
      setTrendPeriod(res.data.period || '');
    } catch (err) {
      console.error('Gagal mengambil tren maintenance:', err);
    } finally {
      setTrendLoading(false);
    }
  }, [windowOffset]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  useEffect(() => {
    const handler = () => {
      if (windowOffset === 0) {
        fetchTrend();
      } else {
        setWindowOffset(0);
      }
    };
    window.addEventListener('refresh-dashboard-trend', handler);
    return () => window.removeEventListener('refresh-dashboard-trend', handler);
  }, [windowOffset, fetchTrend]);

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
            <div className="text-sm text-gray-500 mt-1">Kamar Tersedia</div>
          </div>
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="text-3xl font-bold text-purple-500">{statsData.staffHadirHariIni}</div>
            <div className="text-sm text-gray-500 mt-1">Jumlah Staff Hadir</div>
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

      {/* ===== Bar Chart: Tren Kamar Maintenance per Hari ===== */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Tren Kamar Maintenance</h2>
            <p className="text-sm text-gray-500">
              Jumlah kamar yang dijadwalkan maintenance per hari — 14 hari per periode
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWindowOffset((prev) => Math.max(prev + 1, 0))}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              aria-label="Periode sebelumnya"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-xs font-medium text-gray-500 min-w-[120px] text-center">
              {trendPeriod || '14 hari terakhir'}
            </span>
            <button
              type="button"
              onClick={() => setWindowOffset((prev) => Math.max(prev - 1, 0))}
              disabled={windowOffset === 0}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Periode berikutnya"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {trendLoading ? (
          <p className="text-gray-400 text-sm">Memuat grafik...</p>
        ) : trend.every((t) => t.total === 0) ? (
          <p className="text-gray-400 text-sm py-8 text-center">
            Belum ada data maintenance pada periode ini.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trend} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f5" />
              <XAxis
                dataKey="date"
                tickFormatter={formatShortDate}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={false}
              />
              <Tooltip
                content={(props) => {
                  const { active, payload, label } = props;
                  if (!active || !payload || payload.length === 0) return null;
                  return (
                    <div className="bg-white rounded-lg shadow-md border border-gray-100 px-3 py-2 text-sm">
                      <p className="text-gray-500 text-xs mb-1">{formatShortDate(label)}</p>
                      <p className="text-amber-600 font-semibold">{payload[0].value} kamar masuk maintenance</p>
                    </div>
                  );
                }}
              />
              <Bar dataKey="total" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default Dashboard;