import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';
import InProgressTaskCard from '../components/penugasans/InProgressTaskCard';
import ScheduledTaskCard from '../components/penugasans/ScheduledTaskCard';
import CleaningModal from '../components/penugasans/CleaningModal';

const MIN_PHOTOS = 4;

function PenugasanPembersihan() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [rooms, setRooms] = useState([]);
  const [staff, setStaff] = useState([]);
  const [isCleaningModalOpen, setIsCleaningModalOpen] = useState(false);
  const [cleaningForm, setCleaningForm] = useState({ room_id: '', title: '', notes: '', staff_ids: [] });
  const [cleaningSubmitting, setCleaningSubmitting] = useState(false);
  const [myAttendance, setMyAttendance] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const fileInputRefs = useRef({});

  const inProgressTasks = schedules.filter((s) => s.status === 'in_progress');
  const scheduledTasks = schedules.filter((s) => s.status === 'scheduled');

  const fetchMySchedule = useCallback(async () => {
    try {
      const [schedRes, roomsRes, staffRes] = await Promise.all([
        fetch('http://localhost:3000/api/cleaning-schedule/my-schedule', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }).then((r) => r.json()),
        fetch('http://localhost:3000/api/cleaning-schedule/rooms', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }).then((r) => r.json()),
        fetch('http://localhost:3000/api/cleaning-schedule/staff', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }).then((r) => r.json()),
      ]);
      if (schedRes.success) {
        setSchedules(schedRes.data || []);
      }
      if (roomsRes.success) {
        setRooms(roomsRes.data || []);
      }
      if (staffRes.success) {
        setStaff(staffRes.data || []);
      }
    } catch (err) {
      console.error('Gagal memuat data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchMyAttendance = async () => {
      try {
        const res = await api.get('/attendance/today');
        setMyAttendance(res.data.data || null);
      } catch (err) {
        console.error('Gagal memuat absensi:', err);
        setMyAttendance(null);
      } finally {
        setAttendanceLoading(false);
      }
    };
    fetchMyAttendance();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMySchedule();
    const interval = setInterval(fetchMySchedule, 30000);
    return () => clearInterval(interval);
  }, [fetchMySchedule]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const eventSource = new EventSource(`http://localhost:3000/api/events?token=${token}`);

    eventSource.addEventListener('connected', () => {
      console.log('SSE connected');
    });

    const refresh = () => {
      fetchMySchedule();
    };

    eventSource.addEventListener('cleaning:created', refresh);
    eventSource.addEventListener('cleaning:started', refresh);
    eventSource.addEventListener('cleaning:completed', refresh);
    eventSource.addEventListener('cleaning:canceled', refresh);
    eventSource.addEventListener('cleaning:staffAssigned', refresh);
    eventSource.addEventListener('schedule:started', refresh);
    eventSource.addEventListener('schedule:completed', refresh);
    eventSource.addEventListener('schedule:canceled', refresh);

    return () => {
      eventSource.close();
    };
  }, [fetchMySchedule]);

  const handleStart = async (scheduleId) => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Mulai pembersihan?',
      text: 'Kamar akan di-set menjadi sedang dibersihkan.',
      showConfirmButton: true,
      confirmButtonText: 'Ya, mulai',
      cancelButtonText: 'Batal',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:3000/api/cleaning-schedule/${scheduleId}/start`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: data.message,
          timer: 1500,
          showConfirmButton: false,
        });
        fetchMySchedule();
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    }
  };

  const handleUploadPhotos = async (scheduleId, files) => {
    if (!files || files.length === 0) return;

    setUploading((prev) => ({ ...prev, [scheduleId]: true }));

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('photos', file);
      });

      const res = await fetch(`http://localhost:3000/api/cleaning-schedule/${scheduleId}/upload-photos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: data.message,
          timer: 1000,
          showConfirmButton: false,
        });
        fetchMySchedule();
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    } finally {
      setUploading((prev) => ({ ...prev, [scheduleId]: false }));
    }
  };

  const openCleaningModal = () => {
    const myId = Number(user?.employee_id);
    setCleaningForm({
      room_id: '',
      title: '',
      notes: '',
      staff_ids: !Number.isNaN(myId) ? [myId] : [],
    });
    setIsCleaningModalOpen(true);
  };

  const handleCleaningSubmit = async (e) => {
    e.preventDefault();
    if (!cleaningForm.room_id || !cleaningForm.title) {
      Swal.fire({ icon: 'warning', title: 'Data tidak lengkap', text: 'Pilih kamar dan judul pembersihan.' });
      return;
    }

    setCleaningSubmitting(true);
    try {
      const body = {
        room_id: Number(cleaningForm.room_id),
        title: cleaningForm.title,
        notes: cleaningForm.notes,
        scheduled_date: new Date().toISOString().slice(0, 10),
        staff_ids: Array.isArray(cleaningForm.staff_ids)
          ? cleaningForm.staff_ids.map((id) => Number(id)).filter((id) => !Number.isNaN(id))
          : [],
        set_immediately: true,
      };

      const res = await fetch('http://localhost:3000/api/cleaning-schedule', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({ icon: 'success', title: 'Berhasil', text: data.message, timer: 1500, showConfirmButton: false });
        setIsCleaningModalOpen(false);
        fetchMySchedule();
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    } finally {
      setCleaningSubmitting(false);
    }
  };

  const handleComplete = async (scheduleId, photos) => {
    if ((photos || []).length < MIN_PHOTOS) {
      Swal.fire({
        icon: 'warning',
        title: 'Foto belum cukup',
        text: `Upload minimal ${MIN_PHOTOS} foto sebelum menyelesaikan pembersihan.`,
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'question',
      title: 'Selesaikan pembersihan?',
      text: 'Pastikan semua foto sudah diupload dengan benar.',
      showConfirmButton: true,
      confirmButtonText: 'Ya, selesaikan',
      cancelButtonText: 'Batal',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:3000/api/cleaning-schedule/${scheduleId}/complete`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: data.message,
          timer: 1500,
          showConfirmButton: false,
        });
        fetchMySchedule();
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return `${diff} detik yang lalu`;
    if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
    return `${Math.floor(diff / 86400)} hari yang lalu`;
  };

  const parsePhotos = (photos) => {
    if (Array.isArray(photos)) return photos;
    if (typeof photos === 'string') {
      try {
        const parsed = JSON.parse(photos);
        return Array.isArray(parsed) ? parsed : [photos];
      } catch {
        return [photos];
      }
    }
    return [];
  };

  const myEmployeeId = user?.employee_id;

  if (user?.current_role === 'staff' && !attendanceLoading && (!myAttendance || myAttendance.status !== 'active')) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Penugasan Pembersihan</h1>
          <p className="text-gray-500 mt-1">Kelola tugas pembersihan Anda</p>
        </div>
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <i className="fa-solid fa-lock text-4xl text-gray-300 mb-3"></i>
          <p className="text-gray-500 mb-2">Anda belum melakukan absensi.</p>
          <p className="text-sm text-gray-400">Silakan lakukan absensi terlebih dahulu untuk mengakses penugasan pembersihan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Penugasan Pembersihan</h1>
        <p className="text-gray-500 mt-1">Kelola tugas pembersihan Anda</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                Sedang Mengerjakan
              </h2>
              <button
                type="button"
                onClick={openCleaningModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <i className="fa-solid fa-broom"></i>
                Lakukan Pembersihan
              </button>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-400">Memuat data...</div>
            ) : inProgressTasks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <i className="fa-solid fa-clipboard-check text-4xl text-gray-300 mb-3"></i>
                <p className="text-gray-500">Tidak ada pembersihan yang sedang dikerjakan.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inProgressTasks.map((task) => (
                  <InProgressTaskCard
                    key={task.schedule_id}
                    task={task}
                    myEmployeeId={myEmployeeId}
                    uploading={uploading}
                    fileInputRefs={fileInputRefs}
                    onUploadPhotos={handleUploadPhotos}
                    onComplete={handleComplete}
                    parsePhotos={parsePhotos}
                    getTimeAgo={getTimeAgo}
                    minPhotos={MIN_PHOTOS}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="w-full lg:w-80 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 lg:sticky lg:top-24">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fa-solid fa-calendar-days text-blue-600"></i>
              Jadwal Pembersihan Saya
            </h2>
            {loading ? (
              <p className="text-sm text-gray-400">Memuat data...</p>
            ) : scheduledTasks.length === 0 ? (
              <div className="text-center py-6">
                <i className="fa-regular fa-calendar text-3xl text-gray-300 mb-2"></i>
                <p className="text-sm text-gray-400">Tidak ada jadwal pembersihan.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledTasks.map((task) => (
                  <ScheduledTaskCard
                    key={task.schedule_id}
                    task={task}
                    myEmployeeId={myEmployeeId}
                    onStart={handleStart}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
      <CleaningModal
        isOpen={isCleaningModalOpen}
        onClose={() => setIsCleaningModalOpen(false)}
        rooms={rooms}
        form={cleaningForm}
        onFormChange={setCleaningForm}
        onSubmit={handleCleaningSubmit}
        submitting={cleaningSubmitting}
        staffSelectMode="picker"
        staff={staff}
        user={user}
        selectedIds={cleaningForm.staff_ids || []}
        onAddStaff={(employeeId) => {
          const id = Number(employeeId);
          const current = cleaningForm.staff_ids || [];
          if (!current.includes(id)) {
            setCleaningForm({ ...cleaningForm, staff_ids: [...current, id] });
          }
        }}
        onRemoveStaff={(employeeId) => {
          const id = Number(employeeId);
          const current = cleaningForm.staff_ids || [];
          setCleaningForm({ ...cleaningForm, staff_ids: current.filter((sid) => sid !== id) });
        }}
      />
    </div>
  );
}

export default PenugasanPembersihan;
