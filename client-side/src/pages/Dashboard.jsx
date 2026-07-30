import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // aktifkan kalau mau pakai nama user asli

function getGreeting(date) {
  const hour = date.getHours(); // otomatis ngikutin timezone device/browser (real timezone)

  if (hour >= 0 && hour < 11) return 'Pagi';
  if (hour >= 11 && hour < 15) return 'Siang';
  if (hour >= 15 && hour < 18) return 'Sore';
  return 'Malam'; // 18:00 - 23:59
}

function Dashboard() {
  const [now, setNow] = useState(new Date());
  const { user } = useAuth();

  // Update tiap menit, supaya sapaan otomatis berubah kalau halaman dibiarkan terbuka
  // lewat batas waktu (misal dari Pagi ke Siang) tanpa perlu refresh manual.
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const greeting = getGreeting(now);
  const formattedTime = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Selamat {greeting}, {user?.employee_name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{formattedTime} WIB</p>
      </div>

      {/* konten dashboard lainnya di sini */}
    </div>
  );
}

export default Dashboard;