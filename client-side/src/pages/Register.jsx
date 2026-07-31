import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../services/api';

const POSITIONS = [
  { id: 1, name: 'Super Admin' },
  { id: 2, name: 'General Manager' },
  { id: 3, name: 'Front Office Manager' },
  { id: 4, name: 'Front Office Staff' },
  { id: 5, name: 'Housekeeping Supervisor' },
  { id: 6, name: 'Housekeeping Staff' },
  { id: 7, name: 'Finance Manager' },
];

const initialForm = {
  full_name: '',
  email: '',
  username: '',
  password: '',
  confirm_password: '',
  phone: '',
  position_id: '',
};

export default function Register() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // clear field error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Nama lengkap wajib diisi.';
    if (!form.email.trim()) e.email = 'Email wajib diisi.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Format email tidak valid.';
    if (!form.username.trim()) e.username = 'Username wajib diisi.';
    else if (form.username.length < 3) e.username = 'Username minimal 3 karakter.';
    if (!form.password) e.password = 'Password wajib diisi.';
    else if (form.password.length < 6) e.password = 'Password minimal 6 karakter.';
    if (!form.confirm_password) e.confirm_password = 'Konfirmasi password wajib diisi.';
    else if (form.password !== form.confirm_password) e.confirm_password = 'Password tidak cocok.';
    if (!form.phone.trim()) e.phone = 'Nomor telepon wajib diisi.';
    else if (!/^[0-9]{8,15}$/.test(form.phone.replace(/\D/g, '')))
      e.phone = 'Nomor telepon tidak valid.';
    if (!form.position_id) e.position_id = 'Jabatan wajib dipilih.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        username: form.username,
        password: form.password,
        phone: form.phone,
        position_id: Number(form.position_id),
      };
      const res = await api.post('/auth/register', payload);
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Registrasi Berhasil',
          text: 'Akun berhasil dibuat. Silakan login.',
          timer: 1800,
          showConfirmButton: false,
        });
        navigate('/login');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Registrasi gagal. Coba lagi.';
      Swal.fire({ icon: 'error', title: 'Gagal', text: message });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-lg border ${
      errors[field] ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
    } px-3 py-2 text-sm outline-none transition`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-900 px-4 py-8">
      <div className="bg-white w-full max-w-md p-9 rounded-2xl shadow-2xl">
        {/* Logo & Branding */}
        <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-2xl">
          🏨
        </div>
        <h1 className="text-center text-xl font-semibold text-gray-800 mb-0.5">
          Grand Nusantara Hotel
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">Sistem Housekeeping</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Nama Lengkap */}
          <div>
            <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
              Nama Lengkap
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap"
              className={inputClass('full_name')}
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Masukkan email"
              className={inputClass('email')}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              placeholder="Masukkan username"
              className={inputClass('username')}
            />
            {errors.username && (
              <p className="mt-1 text-xs text-red-500">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Masukkan password"
              className={inputClass('password')}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Konfirmasi Password */}
          <div>
            <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
              Konfirmasi Password
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              value={form.confirm_password}
              onChange={handleChange}
              placeholder="Ulangi password"
              className={inputClass('confirm_password')}
            />
            {errors.confirm_password && (
              <p className="mt-1 text-xs text-red-500">{errors.confirm_password}</p>
            )}
          </div>

          {/* Nomor Telepon */}
          <div>
            <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
              Nomor Telepon
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="Contoh: 08123456789"
              className={inputClass('phone')}
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Jabatan */}
          <div>
            <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
              Jabatan
            </label>
            <select
              id="position_id"
              name="position_id"
              value={form.position_id}
              onChange={handleChange}
              className={`${inputClass('position_id')} bg-white`}
            >
              <option value="">Pilih jabatan</option>
              {POSITIONS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.position_id && (
              <p className="mt-1 text-xs text-red-500">{errors.position_id}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-2.5 font-semibold text-white hover:bg-blue-700 active:scale-95 disabled:opacity-70 transition"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Mendaftar...
              </span>
            ) : (
              'Daftar'
            )}
          </button>
        </form>

        {/* Link ke login */}
        <p className="mt-4 text-center text-sm text-gray-500">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Masuk
          </Link>
        </p>

        {/* Catatan teknis */}
        <p className="mt-3 text-xs text-gray-400 leading-relaxed text-center">
          Registrasi akan membuat akun di tabel <b>users</b> dan otomatis
          menghubungkan ke data <b>employees</b>.
        </p>
      </div>
    </div>
  );
}
