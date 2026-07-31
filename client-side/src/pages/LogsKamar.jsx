import { useState, useEffect } from 'react';
import api from '../services/api';

function LogsKamar() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/room-logs');
                setLogs(res.data.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Gagal memuat data');
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const formatDateTime = (val) => {
        if (!val) return '-';
        const date = new Date(val);
        return date.toLocaleString('id-ID', {
            dateStyle: 'long',
            timeStyle: 'short',
        });
    };

    const getActionLabel = (row) => {
        if (row.checked_in_at && row.checked_out_at) {
            const inTime = new Date(row.checked_in_at).getTime();
            const outTime = new Date(row.checked_out_at).getTime();
            if (outTime > inTime) {
                return (
                    <>
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded mr-1">Check In</span>
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded">Check Out</span>
                    </>
                );
            }
        }
        if (row.checked_out_at) {
            return <span className="inline-block px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded">Check Out</span>;
        }
        if (row.checked_in_at) {
            return <span className="inline-block px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">Check In</span>;
        }
        return null;
    };

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Memuat data...</div>;
    }

    if (error) {
        return <div className="p-6 text-center text-red-500">{error}</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Logs Kamar</h1>
            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="min-w-full text-sm text-left text-gray-600">
                    <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">No</th>
                            <th className="px-6 py-3">Kamar</th>
                            <th className="px-6 py-3">Aksi</th>
                            <th className="px-6 py-3">Waktu Check In</th>
                            <th className="px-6 py-3">Waktu Check Out</th>
                            <th className="px-6 py-3">Status Kamar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                    Belum ada data logs kamar.
                                </td>
                            </tr>
                        ) : (
                            logs.map((row, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-3">{index + 1}</td>
                                    <td className="px-6 py-3 font-medium text-gray-800">{row.room_number}</td>
                                    <td className="px-6 py-3">{getActionLabel(row)}</td>
                                    <td className="px-6 py-3">{formatDateTime(row.checked_in_at)}</td>
                                    <td className="px-6 py-3">{formatDateTime(row.checked_out_at)}</td>
                                    <td className="px-6 py-3">
                                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                                            row.room_status === 'available'
                                                ? 'bg-green-100 text-green-700'
                                                : row.room_status === 'occupied'
                                                ? 'bg-blue-100 text-blue-700'
                                                : row.room_status === 'maintenance'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : row.room_status === 'reserved'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}>
                                            {row.room_status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default LogsKamar;
