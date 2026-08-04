import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            Swal.fire({
                icon: 'warning',
                title: 'Token Kedaluwarsa',
                text: 'Sesi login Anda telah berakhir. Silahkan login kembali.',
                confirmButtonText: 'Login',
                confirmationButtonColor: '#3085d6',
            }).then(() => {
            window.location.href = '/login';
            });
        }
        return Promise.reject(error);
    }
);

export default api;
