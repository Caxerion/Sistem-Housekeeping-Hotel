// src/components/editbuttonmodal/EditButtonStatusKamar.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const EditButtonStatusKamar = ({ 
  isOpen, 
  onClose, 
  roomData, 
  onSuccess,
  roomTypes = [] 
}) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    room_type: '',
    base_price: '',
    occupancy_status: '',
    housekeeping_status: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Permission roles
  const userPosition = user?.employee_position || '';
  const editRoomTypeRoles = ['Super Admin', 'General Manager'];
  const editStatusRoles = ['Super Admin', 'General Manager', 'Housekeeping Supervisor', 
                           'Front Office Staff', 'Front Office Manager'];
  const canEditRoomType = editRoomTypeRoles.includes(userPosition);
  const canEditStatus = editStatusRoles.includes(userPosition);

  // Initialize form data when roomData changes
  useEffect(() => {
    if (roomData?.id) {
      setFormData({
        room_type: roomData.room_type || '',
        base_price: roomData.base_price || '',
        occupancy_status: roomData.occupancy_status || '',
        housekeeping_status: roomData.housekeeping_status || ''
      });
      // Reset messages when opening modal
      setError('');
      setSuccessMessage('');
    }
  }, [roomData]);

  // Early returns
  if (!isOpen) return null;
  if (!roomData?.id) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
          <p className="text-gray-600">Data kamar tidak valid</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // Helpers
  const getPriceFromRoomType = (roomTypeName) => {
    if (!roomTypeName) return '';
    return roomTypes.find(type => type.name === roomTypeName)?.base_price || '';
  };

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'room_type') {
      setFormData(prev => ({ ...prev, room_type: value, base_price: getPriceFromRoomType(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Reset messages on change
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Check for changes
      const hasChanges = (
        (canEditRoomType && (roomData.room_type !== formData.room_type || roomData.base_price !== formData.base_price)) ||
        (canEditStatus && (roomData.occupancy_status !== formData.occupancy_status || roomData.housekeeping_status !== formData.housekeeping_status))
      );

      if (!hasChanges) {
        setError('Tidak ada data yang diubah');
        setLoading(false);
        return;
      }

      // Build payload
      const payload = {
        ...(canEditRoomType && formData.room_type && { room_type: formData.room_type }),
        ...(canEditRoomType && formData.base_price && { base_price: parseInt(formData.base_price) }),
        ...(canEditStatus && formData.occupancy_status && { occupancy_status: formData.occupancy_status }),
        ...(canEditStatus && formData.housekeeping_status && { housekeeping_status: formData.housekeeping_status })
      };

      // Update data
      const response = await api.put(`/rooms/${roomData.id}`, payload);

      if (response.data?.success) {
        // Create updated room data
        const updatedRoom = {
          ...roomData,
          room_type: formData.room_type || roomData.room_type,
          base_price: parseFloat(formData.base_price) || roomData.base_price,
          occupancy_status: formData.occupancy_status || roomData.occupancy_status,
          housekeeping_status: formData.housekeeping_status || roomData.housekeeping_status
        };
        
        setSuccessMessage('Data kamar berhasil diupdate!');
        if (onSuccess) onSuccess(updatedRoom);
        
        setTimeout(onClose, 500);
      } else {
        setError(response.data?.message || 'Gagal mengupdate data kamar');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.message || err.message || 'Gagal mengupdate data kamar');
    } finally {
      setLoading(false);
    }
  };

  // Render form fields
  const renderRoomTypeFields = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Kamar</label>
        <select
          name="room_type"
          value={formData.room_type}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="">Pilih Tipe Kamar</option>
          {roomTypes.map(type => (
            <option key={type.id} value={type.name}>{type.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Harga / Malam</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rp</span>
          <input
            type="number"
            name="base_price"
            value={formData.base_price}
            className="w-full rounded-md border border-gray-300 px-3 py-2 pl-10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Harga akan otomatis terisi"
            readOnly
            disabled={loading}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">💡 Harga akan menyesuaikan dengan tipe kamar yang dipilih</p>
      </div>
    </>
  );

  const renderStatusFields = () => (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          name="occupancy_status"
          value={formData.occupancy_status}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
          <option value="reserved">Reserved</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Housekeeping</label>
        <select
          name="housekeeping_status"
          value={formData.housekeeping_status}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="clean">Clean</option>
          <option value="dirty">Dirty</option>
          <option value="cleaning">Cleaning</option>
        </select>
      </div>
    </>
  );

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        style={{ padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit Kamar #{roomData.room_number}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={loading}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
            ✅ {successMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            ❌ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {canEditRoomType && renderRoomTypeFields()}
            {canEditStatus && renderStatusFields()}
            {!canEditRoomType && !canEditStatus && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md text-sm">
                Anda tidak memiliki izin untuk mengedit data kamar ini.
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Batal
            </button>
            {(canEditRoomType || canEditStatus) && (
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Menyimpan...
                  </span>
                ) : (
                  'Simpan'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditButtonStatusKamar;