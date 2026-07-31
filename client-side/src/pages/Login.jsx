import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      Swal.fire({
        icon: 'success',
        title: 'Login Berhasil',
        text: 'Welcome Bro!',
        timer: 1500,
        showConfirmButton: false,
      });
      navigate('/');
    } catch {
      // error already handled in context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-900">
      <div className="bg-white w-[360px] p-9 rounded-2xl shadow-2xl">
        <div className="w-14 h-14 mx-auto mb-3 flex items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-2xl">
          🏨
        </div>
        <h1 className="text-center text-xl font-semibold text-gray-800 mb-0.5">
          Grand Nusantara Hotel
        </h1>
        <p className="text-center text-gray-500 text-sm mb-6">
          Sistem Housekeeping
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
              Username or Email
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username atau email"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-left text-xs font-semibold text-gray-500 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-left">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-blue-600 px-3 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
          >
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500 leading-relaxed">
          Login memvalidasi ke tabel <b>users</b>, lalu menampilkan nama &amp; role
          dari <b>employees</b> + <b>positions</b>.
        </p>
        <p className="mt-3 text-center text-sm text-gray-500">
          Belum punya akun?{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}