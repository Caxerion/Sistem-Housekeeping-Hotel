import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function Profile() {
  const { user, setUser } = useAuth();
  const { isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState(() => ({
    full_name: '',
    email: '',
    phone: '',
    current_password: '',
    new_password: '',
  }));
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (user && isFirstRender.current) {
      isFirstRender.current = false;
      setFormData({
        full_name: user.employee_name || '',
        email: user.email || '',
        phone: user.phone || '',
        current_password: '',
        new_password: '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
      };

      if (formData.new_password) {
        if (!formData.current_password) {
          Swal.fire({
            icon: 'warning',
            title: 'Password diperlukan',
            text: 'Masukkan password saat ini untuk mengganti password.',
          });
          setLoading(false);
          return;
        }
        payload.password = formData.new_password;
        payload.current_password = formData.current_password;
      }

      const res = await api.put('/auth/profile', payload);

      if (res.data.success) {
        const updatedUser = res.data.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Profil berhasil diperbarui',
          timer: 1500,
          showConfirmButton: false,
        });

        setIsEditing(false);
        setFormData(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
        }));
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err.response?.data?.message || 'Gagal memperbarui profil.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      full_name: user?.employee_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      current_password: '',
      new_password: '',
    });
  };

  return (
    <div className={`p-6 min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-2xl mx-auto">
        <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>Profile</h1>

        <div className={`rounded-xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-medium ${isDark ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-600'}`}>
              {user?.employee_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <h2 className={`mt-4 text-xl font-semibold ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
              {user?.employee_name || 'User'}
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {user?.employee_position || '-'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Nama Lengkap
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border-gray-300'}`}
                  required
                />
              ) : (
                <p className={`text-sm py-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                  {user?.employee_name || '-'}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border-gray-300'}`}
                  required
                />
              ) : (
                <p className={`text-sm py-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                  {user?.email || '-'}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                No. Telepon
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border-gray-300'}`}
                />
              ) : (
                <p className={`text-sm py-2 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                  {user?.phone || '-'}
                </p>
              )}
            </div>

            {/* Username (read-only) */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Username
              </label>
              <p className={`text-sm py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {user?.username || '-'}
              </p>
            </div>

            {/* Password Section */}
            {isEditing && (
              <div className={`space-y-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Ganti Password (opsional)
                </h3>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Password Saat Ini
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="current_password"
                      value={formData.current_password}
                      onChange={handleChange}
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border-gray-300'}`}
                      placeholder="Masukkan password saat ini"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Password Baru
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="new_password"
                    value={formData.new_password}
                    onChange={handleChange}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border-gray-300'}`}
                    placeholder="Masukkan password baru"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70 transition-colors"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile;
