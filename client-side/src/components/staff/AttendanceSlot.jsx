import { useNavigate } from 'react-router-dom';

function AttendanceSlot({
  user,
  myAttendance,
  attendanceLoading,
  checkingIn,
  isWithinWorkingHours,
  countdown,
  cooldownExpired,
  cooldownText,
  onStartAttendance,
  onIzinClick,
}) {
  const navigate = useNavigate();

  const handleIzinClick = () => {
    if (!isWithinWorkingHours()) return;
    onIzinClick();
  };

  const goToEndAttendance = () => {
    navigate(`/attendance/end/${myAttendance.id}`);
  };

  if (user?.current_role !== 'staff') return null;

  return (
    <div className="mt-6 relative border border-dashed border-gray-300 rounded-2xl p-5">
      {!attendanceLoading && !(myAttendance && myAttendance.status === 'active') && (
        <button
          onClick={handleIzinClick}
          disabled={!isWithinWorkingHours()}
          className="absolute -top-3 -right-3 px-4 py-1.5 text-sm font-semibold bg-white border border-amber-200 shadow-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed enabled:text-amber-600 enabled:hover:bg-amber-50"
        >
          {isWithinWorkingHours() ? 'Izin' : `Form Izin dibuka dalam ${countdown}`}
        </button>
      )}
      {attendanceLoading ? (
        <p className="text-gray-400 text-sm">Memuat status absensi...</p>
      ) : myAttendance && myAttendance.status === 'active' ? (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm text-gray-500">Nama Lengkap</p>
            <p className="text-lg font-semibold text-gray-800">{myAttendance.full_name}</p>
            <p className="text-sm text-gray-500 mt-1">
              Mulai shift: <span className="font-medium text-gray-700">{formatTime(myAttendance.check_in_at)}</span>
            </p>
          </div>
          <button
            onClick={goToEndAttendance}
            className="rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white hover:bg-red-700 transition-colors"
          >
            Akhiri Absensi
          </button>
        </div>
      ) : myAttendance && myAttendance.status === 'completed' && !cooldownExpired ? (
        <button
          disabled
          className="w-full py-4 text-center text-gray-500 font-semibold bg-gray-50 rounded-xl cursor-not-allowed"
        >
          Absensi dibuka dalam {cooldownText || '0j 0m 0d'}
        </button>
      ) : (
        <button
          onClick={onStartAttendance}
          disabled={checkingIn}
          className="w-full py-4 text-center text-blue-600 font-semibold hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-60"
        >
          {checkingIn ? 'Memproses...' : '+ Lakukan Absensi'}
        </button>
      )}
    </div>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return '-';
  const dateObj = dateStr instanceof Date ? dateStr : new Date(dateStr);
  if (isNaN(dateObj.getTime())) return '-';
  return dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default AttendanceSlot;
