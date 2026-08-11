import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';
import MaintenanceFormModal from '../components/maintenance/MaintenanceFormModal';
import MaintenanceTable from '../components/maintenance/MaintenanceTable';

/* eslint-disable react-hooks/set-state-in-effect */

const initialForm = {
  room_id: '',
  title: '',
  notes: '',
  scheduled_date: '',
  ended_at: '',
  set_immediately: false,
  staff_ids: [],
};

function PembagianMaintenance() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false);
  const staffDropdownRef = useRef(null);

  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingEllipsis, setEditingEllipsis] = useState(null);
  const [pageInput, setPageInput] = useState('');
  const itemsPerPage = 10;

  const fetchAll = async () => {
    try {
      const [roomsRes, staffRes, schedRes] = await Promise.all([
        api.get('/rooms'),
        api.get('/room-schedule/staff'),
        api.get('/room-schedule'),
      ]);
      const allRooms = roomsRes.data.data || [];
      setRooms(allRooms.filter((r) => r.occupancy_status === 'available'));
      setStaffList(staffRes.data.data || []);
      setSchedules(schedRes.data.data || []);
    } catch (err) {
      console.error('Gagal memuat data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const eventSource = new EventSource(`http://localhost:3000/api/events?token=${token}`);

    eventSource.addEventListener('connected', () => {
      console.log('SSE connected');
    });

    const refresh = () => {
      fetchAll();
    };

    eventSource.addEventListener('schedule:created', refresh);
    eventSource.addEventListener('schedule:started', refresh);
    eventSource.addEventListener('schedule:completed', refresh);
    eventSource.addEventListener('schedule:canceled', refresh);
    eventSource.addEventListener('schedule:staffAssigned', refresh);

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const visibleSchedules = schedules.map((sched) => {
    const isTerminal = sched.status === 'completed' || sched.status === 'canceled';
    if (isTerminal) {
      const terminalTime = sched.completed_at
        ? new Date(sched.completed_at).getTime()
        : new Date(sched.updated_at).getTime();
      if (now - terminalTime >= 5 * 60 * 1000) {
        return {
          ...sched,
          title: null,
          notes: null,
          scheduled_date: null,
          ended_at: null,
          status: null,
          started_at: null,
          completed_at: null,
          assigned_staff: [],
          dijadwalkan_oleh: null,
          housekeeping_status: 'clean',
        };
      }
    }
    return sched;
  });

  const filteredSchedules = visibleSchedules.filter((sched) => {
    if (!search.trim()) return true;
    const keyword = search.toLowerCase();
    const matchRoom = sched.no_kamar?.toLowerCase().includes(keyword);
    const matchStaff =
      Array.isArray(sched.assigned_staff) &&
      sched.assigned_staff.some((name) => name?.toLowerCase().includes(keyword));
    return matchRoom || matchStaff;
  });

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSchedules = filteredSchedules.slice(startIndex, startIndex + itemsPerPage);

  function openEllipsisInput(token) {
    setEditingEllipsis(token);
    setPageInput('');
  }

  function submitPageInput() {
    const target = parseInt(pageInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      setCurrentPage(target);
    }
    setEditingEllipsis(null);
    setPageInput('');
  }

  function handlePageInputKeyDown(e) {
    if (e.key === 'Enter') {
      submitPageInput();
    } else if (e.key === 'Escape') {
      setEditingEllipsis(null);
      setPageInput('');
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (staffDropdownRef.current && !staffDropdownRef.current.contains(e.target)) {
        setStaffDropdownOpen(false);
      }
    };
    if (staffDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [staffDropdownOpen]);

  const toggleStaff = (id) => {
    setForm((prev) => ({
      ...prev,
      staff_ids: prev.staff_ids.includes(id)
        ? prev.staff_ids.filter((s) => s !== id)
        : [...prev.staff_ids, id],
    }));
  };

  const openModal = () => {
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setStaffDropdownOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.room_id || !form.title || !form.scheduled_date) {
      Swal.fire({
        icon: 'warning',
        title: 'Data tidak lengkap',
        text: 'Kamar, judul, dan tanggal wajib diisi.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/room-schedule', {
        room_id: Number(form.room_id),
        title: form.title,
        notes: form.notes,
        scheduled_date: form.scheduled_date,
        ended_at: form.ended_at,
        set_immediately: form.set_immediately,
        staff_ids: form.staff_ids,
      });

      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false,
        });
        closeModal();
        fetchAll();
        window.dispatchEvent(new Event('refresh-dashboard-trend'));
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal membuat jadwal maintenance.';
      Swal.fire({ icon: 'error', title: 'Gagal', text: message });
    } finally {
      setSubmitting(false);
    }
  };

  const refreshSchedules = async () => {
    const schedRes = await api.get('/room-schedule');
    setSchedules(schedRes.data.data || []);
    setNow(Date.now());
    const roomsRes = await api.get('/rooms');
    setRooms((roomsRes.data.data || []).filter((r) => r.occupancy_status === 'available'));
  };

  const handleStart = async (id) => {
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
      const res = await api.put(`/room-schedule/${id}/start`);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false,
        });
        refreshSchedules();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal memulai maintenance.' });
    }
  };

  const handleComplete = async (id) => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Selesaikan maintenance?',
      text: 'Kamar akan kembali menjadi available & housekeeping status menjadi Clean.',
      showConfirmButton: true,
      confirmButtonText: 'Ya, selesaikan',
      cancelButtonText: 'Batal',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await api.put(`/room-schedule/${id}/complete`);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false,
        });
        refreshSchedules();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal menyelesaikan maintenance.' });
    }
  };

  const handleCancel = async (id) => {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Batalkan jadwal?',
      text: 'Jadwal maintenance akan dibatalkan.',
      showConfirmButton: true,
      confirmButtonText: 'Ya, batalkan',
      cancelButtonText: 'Tidak',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;

    try {
      const res = await api.put(`/room-schedule/${id}/cancel`);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: res.data.message,
          timer: 1500,
          showConfirmButton: false,
        });
        refreshSchedules();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal membatalkan jadwal.' });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-4">
      <div className="p-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pembagian Maintenance</h1>
          <p className="text-gray-500 mt-2">Jadwalkan dan kelola maintenance kamar.</p>
        </div>

        {user && (
          <button
            onClick={openModal}
            className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span className="text-lg leading-none">+</span> Tambah Maintenance
          </button>
        )}
      </div>

      <MaintenanceFormModal
        isModalOpen={isModalOpen}
        closeModal={closeModal}
        form={form}
        setForm={setForm}
        rooms={rooms}
        staffList={staffList}
        staffDropdownOpen={staffDropdownOpen}
        setStaffDropdownOpen={setStaffDropdownOpen}
        staffDropdownRef={staffDropdownRef}
        toggleStaff={toggleStaff}
        handleSubmit={handleSubmit}
        submitting={submitting}
      />

      <MaintenanceTable
        loading={loading}
        paginatedSchedules={paginatedSchedules}
        search={search}
        setSearch={setSearch}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        editingEllipsis={editingEllipsis}
        setEditingEllipsis={setEditingEllipsis}
        pageInput={pageInput}
        setPageInput={setPageInput}
        handlePageInputKeyDown={handlePageInputKeyDown}
        submitPageInput={submitPageInput}
        handleStart={handleStart}
        handleComplete={handleComplete}
        handleCancel={handleCancel}
        totalPages={totalPages}
        openEllipsisInput={openEllipsisInput}
      />
    </div>
  );
}

export default PembagianMaintenance;
