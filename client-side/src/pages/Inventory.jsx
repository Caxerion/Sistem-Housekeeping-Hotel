/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

function Inventory() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [takings, setTakings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showTakeModal, setShowTakeModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [takingForm, setTakingForm] = useState({
    employee_id: user?.employee_id || '',
    note: '',
    items: [],
  });

  const [addStockForm, setAddStockForm] = useState({ quantity: '', note: '' });

  const categories = ['Semua', ...new Set(items.map((item) => item.category))];

  const fetchData = async () => {
    try {
      setError(null);
      const [itemsRes, takingsRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/takings'),
      ]);
      setItems(itemsRes.data.data || []);
      setTakings(takingsRes.data.data || []);
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal mengambil data inventory dari server.';
      setError(message);
      console.error('Gagal mengambil data inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openTakeModal = () => {
    setTakingForm({
      employee_id: user?.employee_id || '',
      note: '',
      items: [],
    });
    setShowTakeModal(true);
  };

  const openAddStockModal = (item) => {
    setSelectedItem(item);
    setAddStockForm({ quantity: '', note: '' });
    setShowAddStockModal(true);
  };

  const addTakingItem = () => {
    setTakingForm((prev) => ({
      ...prev,
      items: [...prev.items, { item_id: '', quantity: 1, name: '', unit: '', max_qty: 0 }],
    }));
  };

  const removeTakingItem = (index) => {
    setTakingForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateTakingItem = (index, field, value) => {
    setTakingForm((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleTakeSubmit = async (e) => {
    e.preventDefault();
    if (!takingForm.items.length) {
      Swal.fire({ icon: 'warning', title: 'Data tidak lengkap', text: 'Pilih minimal satu barang.' });
      return;
    }

    const invalidItem = takingForm.items.find((it) => !it.item_id || it.quantity <= 0);
    if (invalidItem) {
      Swal.fire({ icon: 'warning', title: 'Data tidak valid', text: 'Pastikan semua barang memiliki ID dan jumlah valid.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/inventory/takings', {
        employee_id: takingForm.employee_id,
        note: takingForm.note,
        items: takingForm.items.map(({ item_id, quantity }) => ({ item_id, quantity })),
      });
      if (res.data.success) {
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Pengambilan barang berhasil dicatat.', timer: 1500, showConfirmButton: false });
        setShowTakeModal(false);
        fetchData();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal mencatat pengambilan.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    if (!addStockForm.quantity || Number(addStockForm.quantity) <= 0) {
      Swal.fire({ icon: 'warning', title: 'Data tidak valid', text: 'Jumlah stok harus lebih dari 0.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/inventory/items/${selectedItem.id}/add-stock`, {
        quantity: Number(addStockForm.quantity),
        note: addStockForm.note,
      });
      if (res.data.success) {
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Stok berhasil ditambah.', timer: 1500, showConfirmButton: false });
        setShowAddStockModal(false);
        fetchData();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal menambah stok.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (val) => {
    if (!val) return '-';
    const date = new Date(val);
    return date.toLocaleString('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Memuat data inventory...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-4">
      {/* Title Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola stok dan riwayat pengambilan barang</p>
        </div>
        <button
          onClick={openTakeModal}
          className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Lakukan Pengambilan
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl shadow p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Cari nama barang..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 bg-white"
        >
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>
              Kategori: {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Inventory Items */}
      <p className="text-lg font-light text-gray-400 mb-2">Stok Barang</p>

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400 text-sm">
          Tidak ada barang yang ditemukan.
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {filteredItems.map((item) => {
            const isLowStock = item.current_stock <= item.minimum_stock;
            return (
              <div
                key={item.id}
                className={`rounded-2xl shadow p-5 flex items-center justify-between transition-all ${
                  isLowStock ? 'bg-red-50/80 border border-red-100' : 'bg-white'
                }`}
              >
                <div>
                  <h3 className="font-semibold text-gray-800 text-base">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                      {item.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      Min. Stok: {item.minimum_stock} {item.unit}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        isLowStock ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}
                    >
                      Stok: {item.current_stock} {item.unit}
                    </span>
                    {isLowStock && (
                      <span className="block text-xs text-red-500 font-medium mt-1">
                        ⚠️ Stok Menipis
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => openAddStockModal(item)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                  >
                    Tambah
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* History Pengambilan */}
      <p className="text-lg font-light text-gray-400 mb-2">History Pengambilan</p>

      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {takings.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">
            Belum ada riwayat pengambilan barang.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">No</th>
                  <th className="px-6 py-3">Waktu</th>
                  <th className="px-6 py-3">Pengambil</th>
                  <th className="px-6 py-3">Barang yang Diambil</th>
                  <th className="px-6 py-3">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {takings.map((taking, index) => (
                  <tr key={taking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">{index + 1}</td>
                    <td className="px-6 py-3">{formatDateTime(taking.taken_at)}</td>
                    <td className="px-6 py-3 font-medium text-gray-800">{taking.employee_name}</td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {taking.items_summary ? taking.items_summary.split(', ').map((item, i) => (
                          <span key={i} className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs">
                            {item}
                          </span>
                        )) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-gray-500">{taking.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Lakukan Pengambilan */}
      {showTakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTakeModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl">
              <h2 className="text-lg font-semibold text-gray-800">Lakukan Pengambilan Barang</h2>
              <button onClick={() => setShowTakeModal(false)} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Tutup">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleTakeSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Nama Pengambil</label>
                  <input
                    type="text"
                    value={user?.employee_name || ''}
                    disabled
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-600"
                  />
                  <input type="hidden" value={user?.employee_id || ''} />
                </div>
                <div>
                  <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Catatan (Opsional)</label>
                  <input
                    type="text"
                    value={takingForm.note}
                    onChange={(e) => setTakingForm({ ...takingForm, note: e.target.value })}
                    placeholder="Contoh: Untuk cleaning kamar 101"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    style={{ color: '#1f2937' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-left text-xs font-semibold text-gray-500">Daftar Barang</label>
                  <button
                    type="button"
                    onClick={addTakingItem}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    + Tambah Barang
                  </button>
                </div>

                {takingForm.items.length === 0 && (
                  <p className="text-xs text-gray-400">Belum ada barang yang ditambahkan.</p>
                )}

                {takingForm.items.map((it, index) => {
                  return (
                    <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-end">
                      <div className="col-span-12 md:col-span-5">
                        <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Barang</label>
                        <select
                          value={it.item_id}
                      onChange={(e) => {
                        updateTakingItem(index, 'item_id', Number(e.target.value));
                        const selected = items.find((i) => i.id === Number(e.target.value));
                        if (selected) {
                          updateTakingItem(index, 'name', selected.name);
                          updateTakingItem(index, 'unit', selected.unit);
                          updateTakingItem(index, 'max_qty', selected.current_stock);
                        }
                      }}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                          style={{ color: '#1f2937' }}
                          required
                        >
                          <option value="">Pilih barang...</option>
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.current_stock} {item.unit} tersedia)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-6 md:col-span-3">
                        <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Jumlah</label>
                        <input
                          type="number"
                          min="1"
                          max={it.max_qty || 9999}
                          value={it.quantity}
                          onChange={(e) => updateTakingItem(index, 'quantity', Number(e.target.value))}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                          style={{ color: '#1f2937' }}
                          required
                        />
                        {it.max_qty > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">Maks: {it.max_qty} {it.unit}</p>
                        )}
                      </div>
                      <div className="col-span-6 md:col-span-3">
                        <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Tersedia</label>
                        <input
                          type="text"
                          value={it.max_qty ? `${it.max_qty} ${it.unit}` : '-'}
                          disabled
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-600"
                        />
                      </div>
                      <div className="col-span-12 md:col-span-1 flex items-end justify-center">
                        <button
                          type="button"
                          onClick={() => removeTakingItem(index)}
                          className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-2"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowTakeModal(false)} className="rounded-lg px-4 py-2.5 font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-70 transition-colors">
                  {submitting ? 'Menyimpan...' : 'Simpan Pengambilan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Stok */}
      {showAddStockModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddStockModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl">
              <h2 className="text-lg font-semibold text-gray-800">Tambah Stok</h2>
              <button onClick={() => setShowAddStockModal(false)} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Tutup">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddStockSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Barang</label>
                <input
                  type="text"
                  value={`${selectedItem.name} (${selectedItem.unit})`}
                  disabled
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Jumlah yang Ditambahkan</label>
                <input
                  type="number"
                  min="1"
                  value={addStockForm.quantity}
                  onChange={(e) => setAddStockForm({ ...addStockForm, quantity: e.target.value })}
                  placeholder="Masukkan jumlah..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  style={{ color: '#1f2937' }}
                  required
                />
              </div>
              <div>
                <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Catatan (Opsional)</label>
                <input
                  type="text"
                  value={addStockForm.note}
                  onChange={(e) => setAddStockForm({ ...addStockForm, note: e.target.value })}
                  placeholder="Contoh: Restock dari supplier"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  style={{ color: '#1f2937' }}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAddStockModal(false)} className="rounded-lg px-4 py-2.5 font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={submitting} className="rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 disabled:opacity-70 transition-colors">
                  {submitting ? 'Menyimpan...' : 'Tambah Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
