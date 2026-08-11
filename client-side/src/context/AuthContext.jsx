import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const AuthContext = createContext(null);

function getStoredUser() {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem('user');
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    window.localStorage.removeItem('user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const login = async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        const token = data.data.token;
        const userData = data.data.user;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
      }
      throw new Error(data.message || 'Login failed');
    } catch (err) {
      const message = err.message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }

    Swal.fire({
      icon: 'success',
      title: 'Logout Berhasil',
      text: 'Anda telah keluar dari akun, See ya Bro!',
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      navigate('/login');
    });
  };
  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}