import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';
import StaffCard from '../components/absensi-logs/StaffCard';
import LogToolbar from '../components/absensi-logs/LogToolbar';
import LogCard from '../components/absensi-logs/LogCard';
import PhotoModal from '../components/absensi-logs/PhotoModal';
import { groupLogsByPeriod, getAvailablePeriods, CalendarIcon } from '../components/absensi-logs/helpers';

/* eslint-disable react-hooks/set-state-in-effect */

function AbsensiLogs() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingStaff, setViewingStaff] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('all');

  const fetchStaff = async () => {
    try {
      const res = await api.get('/staff/overview');
      setStaffList(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data staff:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    const employeeIdParam = searchParams.get('employee_id');
    if (!employeeIdParam || user?.current_role === 'admin') return;

    const staff = staffList.find((s) => String(s.id) === String(employeeIdParam));
    if (!staff) return;

    setViewingStaff(staff);
    setSelectedPeriod('');
    setSelectedWeek('all');
    setLogsLoading(true);
    api.get('/attendance/logs', { params: { employee_id: staff.id } })
      .then((res) => setLogs(res.data.data || []))
      .catch(() => Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal memuat log absensi.' }))
      .finally(() => setLogsLoading(false));
  }, [searchParams, staffList, user]);

  const handleViewLogs = async (staff) => {
    setViewingStaff(staff);
    setSelectedPeriod('');
    setSelectedWeek('all');
    setLogsLoading(true);
    try {
      const res = await api.get('/attendance/logs', { params: { employee_id: staff.id } });
      setLogs(res.data.data || []);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.message || 'Gagal memuat log absensi.',
      });
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSelectPeriod = (period) => {
    setSelectedPeriod(period);
    setSelectedWeek('all');
  };

  const handleSelectWeek = (week) => {
    setSelectedWeek(week);
  };

  const handleBack = () => {
    setViewingStaff(null);
    setLogs([]);
    setSelectedPeriod('');
    setSelectedWeek('all');
  };

  const handleViewPhotos = (log) => {
    setSelectedLog(log);
    setPhotoModalOpen(true);
  };

  const closePhotoModal = () => {
    setPhotoModalOpen(false);
    setSelectedLog(null);
  };

  const goToStaffStatus = () => {
    navigate('/staff');
  };

  const filteredStaffList = staffList.filter((staff) => {
    const query = searchQuery.toLowerCase();
    return (
      staff.full_name?.toLowerCase().includes(query) ||
      staff.position?.toLowerCase().includes(query) ||
      staff.phone?.toLowerCase().includes(query)
    );
  });

  const availablePeriods = getAvailablePeriods(logs);
  const filteredGroupedLogs = (() => {
    const grouped = groupLogsByPeriod(logs);
    if (!selectedPeriod) return grouped;
    const periodData = grouped[selectedPeriod];
    if (!periodData) return {};
    if (selectedWeek === 'all') return { [selectedPeriod]: periodData };
    const weekKey = `Minggu ${selectedWeek}`;
    return { [selectedPeriod]: { [weekKey]: periodData[weekKey] } };
  })();

  const totalFilteredLogs = Object.values(filteredGroupedLogs).reduce(
    (sum, weeks) => sum + Object.values(weeks).reduce((s, w) => s + w.logs.length, 0),
    0
  );

  return (
    <div className="p-4 sm:p-6 bg-white min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
            {viewingStaff ? `Log Absensi - ${viewingStaff.full_name}` : 'Log Absensi'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            {viewingStaff
              ? `Riwayat absensi untuk ${viewingStaff.full_name}`
              : 'Pilih staff untuk melihat log absensi'}
          </p>
        </div>
        {viewingStaff ? (
          user?.current_role === 'admin' ? (
            <button
              onClick={handleBack}
              className="w-full sm:w-auto rounded-lg border border-gray-200 px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              Kembali ke Daftar Staff
            </button>
          ) : (
            <button
              onClick={goToStaffStatus}
              className="w-full sm:w-auto rounded-lg border border-gray-200 px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              Kembali ke Status Staff
            </button>
          )
        ) : (
          <button
            onClick={goToStaffStatus}
            className="w-full sm:w-auto rounded-lg border border-gray-200 px-4 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-sm"
          >
            Kembali ke Status Staff
          </button>
        )}
      </div>

      {!viewingStaff ? (
        <>
          <div className="bg-white rounded-2xl shadow p-4 mb-6">
            <input
              type="text"
              placeholder="Cari nama, posisi, atau no. handphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {loading ? (
            <p className="text-gray-400 text-sm">Memuat data staff...</p>
          ) : filteredStaffList.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400 text-sm">
              {staffList.length === 0 ? 'Belum ada data staff.' : 'Tidak ada staff yang cocok dengan pencarian.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStaffList.map((staff) => (
                <StaffCard key={staff.id} staff={staff} onViewLogs={handleViewLogs} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {logsLoading ? (
            <p className="text-gray-400 text-sm">Memuat log absensi...</p>
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400 text-sm">
              Belum ada data absensi untuk staff ini.
            </div>
          ) : (
            <div>
              <LogToolbar
                selectedPeriod={selectedPeriod}
                selectedWeek={selectedWeek}
                availablePeriods={availablePeriods}
                onSelectPeriod={handleSelectPeriod}
                onSelectWeek={handleSelectWeek}
                totalFilteredLogs={totalFilteredLogs}
              />

              {totalFilteredLogs === 0 ? (
                <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400 text-sm">
                  Tidak ada log absensi untuk filter yang dipilih.
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(filteredGroupedLogs).map(([period, weeks]) => (
                    <div key={period}>
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 whitespace-nowrap">
                          {weeks && Object.keys(weeks).length > 0 ? weeks[Object.keys(weeks)[0]].periodLabel || period : period}
                        </h3>
                        <div className="h-px flex-1 bg-gray-100" />
                      </div>

                      <div className="space-y-5">
                        {Object.entries(weeks).map(([weekKey, weekData]) => (
                          <div key={weekKey}>
                            <div className="flex items-center gap-2 mb-2.5">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                                <CalendarIcon />
                                {weekData.label}
                              </span>
                              <span className="text-xs text-gray-400">
                                ({weekData.logs.length} log)
                              </span>
                            </div>

                            <div className="space-y-3">
                              {weekData.logs.map((log) => (
                                <LogCard key={log.id} log={log} onViewPhotos={handleViewPhotos} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <PhotoModal
        selectedLog={selectedLog}
        photoModalOpen={photoModalOpen}
        closePhotoModal={closePhotoModal}
      />
    </div>
  );
}

export default AbsensiLogs;
