import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';
import AttendanceSlot from '../components/staff/AttendanceSlot';
import { StaffToolbar, StaffTable } from '../components/staff/StaffTable';

/* eslint-disable react-hooks/set-state-in-effect */

function Staff() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');

  const [myAttendance, setMyAttendance] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [countdown, setCountdown] = useState('');
  const [cooldownExpired, setCooldownExpired] = useState(false);
  const [cooldownText, setCooldownText] = useState('');

  const isWithinWorkingHours = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 6 && hour < 19;
  };

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentHour = now.getHours();
      let target = new Date(now);
      target.setHours(6, 0, 0, 0);

      if (currentHour >= 19) {
        target.setDate(target.getDate() + 1);
      } else if (currentHour < 6) {
        target.setDate(target.getDate());
      } else {
        setCountdown('');
        return;
      }

      const diff = target - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(`${hours}j ${minutes}m ${seconds}d`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!myAttendance || myAttendance.status !== 'completed' || !myAttendance.check_out_at) {
      setCooldownExpired(false);
      setCooldownText('');
      return;
    }

    const updateCooldown = () => {
      const checkout = new Date(myAttendance.check_out_at);
      if (isNaN(checkout.getTime())) {
        setCooldownExpired(false);
        setCooldownText('');
        return;
      }
      const nextAvailable = new Date(checkout.getTime() + 5 * 60 * 60 * 1000);
      const now = new Date();
      const expired = now >= nextAvailable;
      setCooldownExpired(expired);

      if (expired) {
        setCooldownText('');
        return;
      }

      const diff = nextAvailable - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCooldownText(`${hours}j ${minutes}m ${seconds}d`);
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [myAttendance]);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/staff/overview');
      setStaffList(res.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data staff:', err.response?.status, err.response?.data || err.message);
      setError(err.response?.data?.message || 'Gagal memuat data staff.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAttendance = async () => {
    try {
      const res = await api.get('/attendance/today');
      setMyAttendance(res.data.data);
    } catch (err) {
      console.error('Gagal mengambil status absensi:', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchMyAttendance();
  }, []);

  const handleStartAttendance = async () => {
    setCheckingIn(true);
    try {
      const res = await api.post('/attendance/check-in');
      setMyAttendance(res.data.data);
      fetchStaff();
      Swal.fire({
        icon: 'success',
        title: 'Absensi Berhasil!',
        text: 'Absensi Anda tercatat sebagai aktif',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.message || 'Gagal memulai absensi.',
      });
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">Staff</h1>
      <p className="text-gray-500 mt-2">Daftar staff Hotel Grand Nusantara</p>

      <AttendanceSlot
        user={user}
        myAttendance={myAttendance}
        attendanceLoading={attendanceLoading}
        checkingIn={checkingIn}
        isWithinWorkingHours={isWithinWorkingHours}
        countdown={countdown}
        cooldownExpired={cooldownExpired}
        cooldownText={cooldownText}
        onStartAttendance={handleStartAttendance}
        onEndAttendance={() => navigate(`/attendance/end/${myAttendance.id}`)}
        onIzinClick={() => navigate('/izin')}
      />

      <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm overflow-x-auto">
        <StaffToolbar
          user={user}
          navigate={navigate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        <StaffTable
          staffList={staffList}
          loading={loading}
          error={error}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
}

export default Staff;
