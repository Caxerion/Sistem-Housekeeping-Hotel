import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const MIN_PHOTOS = 4;

function Penugasan() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState({});
  const [rooms, setRooms] = useState([]);
  const [housekeepingStaff, setHousekeepingStaff] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ room_id: '', request_notes: '' });
  const [isCleaningModalOpen, setIsCleaningModalOpen] = useState(false);
  const [cleaningSubmitting, setCleaningSubmitting] = useState(false);
  const [cleaningForm, setCleaningForm] = useState({ room_id: '', title: '', notes: '', staff_ids: [] });
  const fileInputRefs = useRef({});

  const openCleaningModal = () => {
    setCleaningForm((prev) => ({
      ...prev,
      staff_ids: user?.current_role === 'staff' ? [`${user.employee_id}`] : prev.staff_ids,
    }));
    setIsCleaningModalOpen(true);
  };

  const inProgressTasks = schedules.filter((s) => s.status === 'in_progress');
  const scheduledTasks = schedules.filter((s) => s.status === 'scheduled');

  const fetchMySchedule = useCallback(async () => {
    try {
      const [schedRes, roomsRes, staffRes] = await Promise.all([
        fetch('http://localhost:3000/api/room-schedule/my-schedule', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }).then((r) => r.json()),
        fetch('http://localhost:3000/api/rooms', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }).then((r) => r.json()),
        fetch('http://localhost:3000/api/room-schedule/staff', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }).then((r) => r.json()),
      ]);
      if (schedRes.success) {
        setSchedules(schedRes.data || []);
      }
      if (roomsRes.success) {
        setRooms((roomsRes.data || []).filter((r) => r.occupancy_status === 'available'));
      }
      if (staffRes.success) {
        setHousekeepingStaff(staffRes.data || []);
      }
    } catch (err) {
      console.error('Gagal memuat data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchMySchedule();
    };

    load();
    const interval = setInterval(fetchMySchedule, 30000);
    return () => clearInterval(interval);
  }, [fetchMySchedule]);

  const handleStart = async (scheduleId) => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Mulai maintenance?',
      text: 'Kamar akan di-set menjadi maintenance.',
      showConfirmButton: true,
      confirmButtonText: 'Ya, mulai',
      cancelButtonText: 'Batal',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:3000/api/room-schedule/${scheduleId}/start`, {
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

      const res = await fetch(`http://localhost:3000/api/room-schedule/${scheduleId}/upload-photos`, {
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

  const handleComplete = async (scheduleId, photos) => {
    if ((photos || []).length < MIN_PHOTOS) {
      Swal.fire({
        icon: 'warning',
        title: 'Foto belum cukup',
        text: `Upload minimal ${MIN_PHOTOS} foto sebelum menyelesaikan maintenance.`,
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'question',
      title: 'Selesaikan maintenance?',
      text: 'Pastikan semua foto sudah diupload dengan benar.',
      showConfirmButton: true,
      confirmButtonText: 'Ya, selesaikan',
      cancelButtonText: 'Batal',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:3000/api/room-schedule/${scheduleId}/complete`, {
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

  const handleCancelCleaning = async (scheduleId) => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Batalkan pembersihan?',
      text: 'Apakah Anda yakin ingin membatalkan pembersihan ini?',
      showConfirmButton: true,
      confirmButtonText: 'Ya, batalkan',
      cancelButtonText: 'Batal',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`http://localhost:3000/api/room-schedule/${scheduleId}/cancel`, {
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

      const res = await fetch('http://localhost:3000/api/room-schedule', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        const scheduleId = data.data?.id;
        if (scheduleId && Array.isArray(cleaningForm.staff_ids) && cleaningForm.staff_ids.length > 0) {
          const assignRes = await fetch(`http://localhost:3000/api/room-schedule/${scheduleId}/assign-staff`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ employee_ids: cleaningForm.staff_ids }),
          });
          const assignData = await assignRes.json();
          if (!assignData.success) {
            throw new Error(assignData.message || 'Gagal menugaskan staff.');
          }
        }

        Swal.fire({ icon: 'success', title: 'Berhasil', text: data.message, timer: 1500, showConfirmButton: false });
        setIsCleaningModalOpen(false);
        setCleaningForm({ room_id: '', title: '', notes: '', staff_ids: user?.current_role === 'staff' ? [user.employee_id] : [] });
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

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.room_id) {
      Swal.fire({ icon: 'warning', title: 'Data tidak lengkap', text: 'Pilih kamar terlebih dahulu.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:3000/api/room-schedule/request', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestForm),
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
        setIsModalOpen(false);
        setRequestForm({ room_id: '', request_notes: '' });
        fetchMySchedule();
      } else {
        Swal.fire({ icon: 'error', title: 'Gagal', text: data.message });
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    } finally {
      setSubmitting(false);
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

  const myEmployeeId = user?.employee_id;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Penugasan Maintenance</h1>
        <p className="text-gray-500 mt-1">Kelola tugas maintenance Anda</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Main Area */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Sedang Mengerjakan Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                Sedang Mengerjakan
              </h2>
              <button
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
                <p className="text-gray-500">Tidak ada maintenance yang sedang dikerjakan.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {inProgressTasks.map((task) => {
                  const photos = task.photos ? JSON.parse(task.photos) : [];
                  const staffNames = Array.isArray(task.assigned_staff) ? task.assigned_staff : [];
                  const staffIds = Array.isArray(task.assigned_staff_ids) ? task.assigned_staff_ids : [];

                  return (
                    <div
                      key={task.schedule_id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-xl font-bold text-gray-800">#{task.no_kamar}</span>
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase bg-blue-100 text-blue-700">
                                {task.title}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              Dimulai {getTimeAgo(task.started_at)}
                            </p>
                          </div>
                        </div>

                        {/* Staff List */}
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Petugas</p>
                          <div className="flex flex-wrap gap-2">
                            {staffNames.map((name, idx) => {
                              const isMe = staffIds[idx] === myEmployeeId;
                              return (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                                    isMe
                                      ? 'bg-green-100 text-green-700 border border-green-200'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      isMe ? 'bg-green-500' : 'bg-gray-400'
                                    }`}
                                  ></span>
                                  {name}
                                  {isMe && <span className="text-[10px]">(Anda)</span>}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Photos Section */}
                        <div className="mt-5">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Foto Dokumentasi ({photos.length}/{MIN_PHOTOS} minimal)
                          </p>

                          {photos.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {photos.map((photo, idx) => (
                                <div
                                  key={idx}
                                  className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
                                >
                                  <img
                                    src={`http://localhost:3000${photo}`}
                                    alt={`Foto ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <input
                              ref={(el) => {
                                if (!fileInputRefs.current[task.schedule_id]) {
                                  fileInputRefs.current[task.schedule_id] = {};
                                }
                                fileInputRefs.current[task.schedule_id].upload = el;
                              }}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              multiple
                              onChange={(e) => {
                                if (e.target.files.length > 0) {
                                  handleUploadPhotos(task.schedule_id, e.target.files);
                                  e.target.value = '';
                                }
                              }}
                              className="hidden"
                            />
                            <button
                              onClick={() => fileInputRefs.current[task.schedule_id]?.upload?.click()}
                              disabled={uploading[task.schedule_id]}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                            >
                              <i className="fa-solid fa-camera"></i>
                              {uploading[task.schedule_id] ? 'Mengupload...' : photos.length === 0 ? 'Upload Foto' : 'Tambah Foto'}
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => handleComplete(task.schedule_id, photos)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
                          >
                            <i className="fa-solid fa-check"></i>
                            Selesaikan
                          </button>
                          <button
                            onClick={() => handleCancelCleaning(task.schedule_id)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
                          >
                            <i className="fa-solid fa-xmark"></i>
                            Batalkan Pembersihan
                          </button>
                          <span className="text-xs text-gray-400">
                            {photos.length < MIN_PHOTOS
                              ? `Upload ${MIN_PHOTOS - photos.length} foto lagi untuk bisa menyelesaikan.`
                              : 'Siap diselesaikan.'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Minta Maintenance Section */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
              Minta Maintenance
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <p className="text-sm text-gray-500 mb-4">
                Butuh maintenance di kamar tertentu? Ajukan permintaan ke supervisor.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <i className="fa-solid fa-plus"></i>
                Ajukan Permintaan Maintenance
              </button>
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
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
                <p className="text-sm text-gray-400">Tidak ada jadwal maintenance.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledTasks.map((task) => {
                  const staffNames = Array.isArray(task.assigned_staff) ? task.assigned_staff : [];
                  const staffIds = Array.isArray(task.assigned_staff_ids) ? task.assigned_staff_ids : [];
                  const isAssigned = staffIds.includes(myEmployeeId);

                  return (
                    <div
                      key={task.schedule_id}
                      className="p-4 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-gray-800">#{task.no_kamar}</span>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-yellow-100 text-yellow-700">
                          Dijadwalkan
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">{task.title}</p>
                      <p className="text-xs text-gray-500 mb-2">
                        <i className="fa-regular fa-calendar mr-1"></i>
                        {task.scheduled_date}
                      </p>
                      {staffNames.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {staffNames.map((name, idx) => {
                            const nameIsMe = staffIds[idx] === myEmployeeId;
                            return (
                              <span
                                key={idx}
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  nameIsMe
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {name}
                                {nameIsMe && ' (Anda)'}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {isAssigned && (
                        <button
                          onClick={() => handleStart(task.schedule_id)}
                          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                          <i className="fa-solid fa-play"></i>
                          Mulai Sekarang
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Cleaning Assignment Modal */}
      {isCleaningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsCleaningModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Lakukan Pembersihan</h2>
              <button
                onClick={() => setIsCleaningModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Tutup"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCleaningSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Pilih Kamar</label>
                <select
                  value={cleaningForm.room_id}
                  onChange={(e) => setCleaningForm({ ...cleaningForm, room_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Pilih kamar...</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.room_number} - {room.room_type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Judul Pembersihan</label>
                <input
                  type="text"
                  value={cleaningForm.title}
                  onChange={(e) => setCleaningForm({ ...cleaningForm, title: e.target.value })}
                  placeholder="Contoh: Pembersihan Kamar Tamu"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Pilih Petugas</label>
                {user?.current_role === 'staff' ? (
                  <div className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700 bg-gray-50">
                    {user.full_name} (Anda)
                  </div>
                ) : (
                  <select
                    value={cleaningForm.staff_ids}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, (option) => Number(option.value));
                      setCleaningForm({ ...cleaningForm, staff_ids: selected });
                    }}
                    multiple
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 h-32"
                    required
                  >
                    {housekeepingStaff.map((staff) => (
                      <option key={staff.employee_id} value={staff.employee_id}>
                        {staff.full_name} - {staff.position}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Catatan</label>
                <textarea
                  value={cleaningForm.notes}
                  onChange={(e) => setCleaningForm({ ...cleaningForm, notes: e.target.value })}
                  placeholder="Opsional: informasi tambahan untuk petugas"
                  rows="3"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={cleaningSubmitting}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-70 transition-colors"
                >
                  {cleaningSubmitting ? 'Menyimpan...' : 'Buat Tugas Pembersihan'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCleaningModalOpen(false)}
                  className="rounded-lg px-5 py-2.5 font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Maintenance Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Ajukan Permintaan Maintenance</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Tutup"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleRequest} className="p-6 space-y-4">
              <div>
                <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
                  Pilih Kamar
                </label>
                <select
                  value={requestForm.room_id}
                  onChange={(e) => setRequestForm({ ...requestForm, room_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  style={{ color: '#1f2937' }}
                  required
                >
                  <option value="">Pilih kamar...</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.room_number} - {room.room_type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={requestForm.request_notes}
                  onChange={(e) => setRequestForm({ ...requestForm, request_notes: e.target.value })}
                  placeholder="Jelaskan masalah yang perlu diperbaiki..."
                  rows="3"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 resize-none"
                  style={{ color: '#1f2937' }}
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-70 transition-colors"
                >
                  {submitting ? 'Mengirim...' : 'Kirim Permintaan'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-5 py-2.5 font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Penugasan;
