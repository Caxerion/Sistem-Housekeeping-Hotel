import { useState, useEffect } from 'react';
import api from '../services/api';

// Data Dummy sesuai database/seeders/inventory.seeder.sql
const DUMMY_INVENTORY= [
  { id: 1, category: 'Linen', name: 'Handuk Mandi', unit: 'pcs', current_stock: 80, minimum_stock: 20 },
  { id: 2, category: 'Toiletries', name: 'Sabun Mandi', unit: 'botol', current_stock: 150, minimum_stock: 30 },
  { id: 3, category: 'Cleaning Supplies', name: 'Cairan Pembersih Lantai', unit: 'botol', current_stock: 8, minimum_stock: 10 },
  { id: 4, category: 'Antiseptik', name: 'Hand Sanitizer', unit: 'botol', current_stock: 40, minimum_stock: 15 },
  { id: 5, category: 'Antiseptik', name: 'Cairan Disinfektan Permukaan', unit: 'liter', current_stock: 12, minimum_stock: 15 },
  { id: 6, category: 'Antiseptik', name: 'Alkohol 70%', unit: 'botol', current_stock: 25, minimum_stock: 10 },
];

function Inventory() {
  const [items, setItems] = useState(DUMMY_INVENTORY);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  //NANTI KALO BACKEND DAH READY, HAPUS DUMMY_INVENTORY trus useEffect nya di pake yak
  /*
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await api.get('/inventory');
        setItems(res.data.data || res.data);
      } catch (err) {
        console.error('Gagal mengambil data inventory:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);
  */

  const categories = ['Semua', ...new Set(items.map((item) => item.category))];

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6">
      {/* Title Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daftar Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola stok dan perlengkapan hotel</p>
        </div>
        <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
          Dummy Mode
        </span>
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
              Category: {cat}
            </option>
          ))}
        </select>
      </div>

      {/* List Item Container */}
      <p className="text-lg font-light text-gray-400 mb-2">Stok Barang</p>

      {loading ? (
        <p className="text-gray-400">Memuat data inventory...</p>
      ) : (
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400 text-sm">
              Tidak ada barang yang ditemukan.
            </div>
          ) : (
            filteredItems.map((item) => {
              const isLowStock = item.current_stock <= item.minimum_stock;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl shadow p-5 flex items-center justify-between transition-all ${
                    isLowStock 
                        ? 'bg-red-50/80 border border-red-100' // Merah muda lembut full kotak + border halus
                        : 'bg-white'                           // Warna putih biasa jika stok aman
                  }`}
                >
                  {/* Left Info */}
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

                  {/* Right Info / Stock Badge */}
                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        isLowStock
                          ? 'bg-red-100 text-red-600'
                          : 'bg-green-100 text-green-600'
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
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default Inventory;