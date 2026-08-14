/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';

function InventoryMasterData() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);

  const [itemForm, setItemForm] = useState({ category_id: '', name: '', unit: '', current_stock: 0, minimum_stock: 0 });
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = async () => {
    try {
      const [catRes, itemRes] = await Promise.all([
        api.get('/inventory/categories'),
        api.get('/inventory'),
      ]);
      setCategories(catRes.data.data || []);
      setItems(itemRes.data.data || []);
    } catch (err) {
      console.error('Gagal mengambil data master:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      Swal.fire({ icon: 'warning', title: 'Data tidak lengkap', text: 'Nama kategori wajib diisi.' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await api.put(`/inventory/categories/${editingCategory.id}`, categoryForm);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Kategori berhasil diperbarui.', timer: 1500, showConfirmButton: false });
        setEditingCategory(null);
      } else {
        await api.post('/inventory/categories', categoryForm);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Kategori berhasil ditambahkan.', timer: 1500, showConfirmButton: false });
      }
      setCategoryForm({ name: '', description: '' });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal menyimpan kategori.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, description: category.description || '' });
  };

  const handleDeleteCategory = async (id) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hapus kategori?',
      text: 'Kategori yang sudah digunakan oleh barang tidak dapat dihapus.',
      showConfirmButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/inventory/categories/${id}`);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Kategori berhasil dihapus.', timer: 1500, showConfirmButton: false });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal menghapus kategori.' });
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.category_id || !itemForm.name || !itemForm.unit) {
      Swal.fire({ icon: 'warning', title: 'Data tidak lengkap', text: 'Kategori, nama, dan unit wajib diisi.' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem.id}`, itemForm);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Barang berhasil diperbarui.', timer: 1500, showConfirmButton: false });
        setEditingItem(null);
      } else {
        await api.post('/inventory', itemForm);
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Barang berhasil ditambahkan.', timer: 1500, showConfirmButton: false });
      }
      setItemForm({ category_id: '', name: '', unit: '', current_stock: 0, minimum_stock: 0 });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal menyimpan barang.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      category_id: item.category_id,
      name: item.name,
      unit: item.unit,
      current_stock: item.current_stock,
      minimum_stock: item.minimum_stock,
    });
  };

  const handleDeleteItem = async (id) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Hapus barang?',
      text: 'Data barang akan dihapus permanen.',
      showConfirmButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      showCancelButton: true,
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/inventory/${id}`);
      Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Barang berhasil dihapus.', timer: 1500, showConfirmButton: false });
      fetchData();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal menghapus barang.' });
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '' });
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setItemForm({ category_id: '', name: '', unit: '', current_stock: 0, minimum_stock: 0 });
  };

  if (user?.current_role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          Akses ditolak: Hanya admin yang dapat mengakses halaman ini.
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Memuat data master...</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Master Data Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola kategori dan barang inventaris</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setActiveTab('categories'); resetCategoryForm(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'categories' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Kategori
        </button>
        <button
          onClick={() => { setActiveTab('items'); resetItemForm(); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'items' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Barang
        </button>
      </div>

      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}
            </h2>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Nama Kategori</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="Contoh: Pembersih"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  style={{ color: '#1f2937' }}
                  required
                />
              </div>
              <div>
                <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Deskripsi (Opsional)</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  placeholder="Deskripsi kategori..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 resize-none"
                  style={{ color: '#1f2937' }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-70 transition-colors"
                >
                  {submitting ? 'Menyimpan...' : editingCategory ? 'Perbarui' : 'Tambah'}
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="rounded-lg px-4 py-2.5 font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm text-left text-gray-600 responsive-table">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Nama</th>
                  <th className="px-6 py-3">Deskripsi</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-6 text-center text-gray-400">
                      Belum ada kategori.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td data-label="ID" className="px-6 py-3">{cat.id}</td>
                      <td data-label="Nama" className="px-6 py-3 font-medium text-gray-800">{cat.name}</td>
                      <td data-label="Deskripsi" className="px-6 py-3 text-gray-500">{cat.description || '-'}</td>
                      <td data-label="Aksi" className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditCategory(cat)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editingItem ? 'Edit Barang' : 'Tambah Barang'}
            </h2>
            <form onSubmit={handleItemSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Kategori</label>
                  <select
                    value={itemForm.category_id}
                    onChange={(e) => setItemForm({ ...itemForm, category_id: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    style={{ color: '#1f2937' }}
                    required
                  >
                    <option value="">Pilih kategori...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Nama Barang</label>
                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="Contoh: Handuk Mandi"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    style={{ color: '#1f2937' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Unit</label>
                  <input
                    type="text"
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    placeholder="Contoh: pcs, liter, pack"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    style={{ color: '#1f2937' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Stok Awal</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.current_stock}
                    onChange={(e) => setItemForm({ ...itemForm, current_stock: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    style={{ color: '#1f2937' }}
                  />
                </div>
                <div>
                  <label className="block text-left text-xs font-semibold text-gray-500 mb-1">Minimum Stok</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.minimum_stock}
                    onChange={(e) => setItemForm({ ...itemForm, minimum_stock: Number(e.target.value) })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    style={{ color: '#1f2937' }}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-70 transition-colors"
                >
                  {submitting ? 'Menyimpan...' : editingItem ? 'Perbarui' : 'Tambah'}
                </button>
                {editingItem && (
                  <button
                    type="button"
                    onClick={resetItemForm}
                    className="rounded-lg px-4 py-2.5 font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <table className="w-full text-sm text-left text-gray-600 responsive-table">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Nama</th>
                  <th className="px-6 py-3">Kategori</th>
                  <th className="px-6 py-3">Unit</th>
                  <th className="px-6 py-3">Stok</th>
                  <th className="px-6 py-3">Min. Stok</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-6 text-center text-gray-400">
                      Belum ada barang.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td data-label="ID" className="px-6 py-3">{item.id}</td>
                      <td data-label="Nama" className="px-6 py-3 font-medium text-gray-800">{item.name}</td>
                      <td data-label="Kategori" className="px-6 py-3">{item.category}</td>
                      <td data-label="Unit" className="px-6 py-3">{item.unit}</td>
                      <td data-label="Stok" className="px-6 py-3">{item.current_stock}</td>
                      <td data-label="Min. Stok" className="px-6 py-3">{item.minimum_stock}</td>
                      <td data-label="Aksi" className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryMasterData;
