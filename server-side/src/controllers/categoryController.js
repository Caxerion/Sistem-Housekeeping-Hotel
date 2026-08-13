const pool = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

const getAllCategories = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM inventory_categories ORDER BY id ASC');
  res.json({ success: true, data: rows });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi.' });
  }

  const [existing] = await pool.query('SELECT id FROM inventory_categories WHERE name = ?', [name.trim()]);
  if (existing.length > 0) {
    return res.status(409).json({ success: false, message: 'Kategori dengan nama tersebut sudah ada.' });
  }

  const [result] = await pool.query(
    'INSERT INTO inventory_categories (name, description) VALUES (?, ?)',
    [name.trim(), description || null]
  );

  res.status(201).json({ success: true, message: 'Kategori berhasil ditambahkan.', data: { id: result.insertId } });
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi.' });
  }

  const [existing] = await pool.query('SELECT id FROM inventory_categories WHERE id = ?', [id]);
  if (existing.length === 0) {
    return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
  }

  const [duplicate] = await pool.query('SELECT id FROM inventory_categories WHERE name = ? AND id != ?', [name.trim(), id]);
  if (duplicate.length > 0) {
    return res.status(409).json({ success: false, message: 'Kategori dengan nama tersebut sudah ada.' });
  }

  await pool.query(
    'UPDATE inventory_categories SET name = ?, description = ? WHERE id = ?',
    [name.trim(), description || null, id]
  );

  res.json({ success: true, message: 'Kategori berhasil diperbarui.' });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existing] = await pool.query('SELECT id FROM inventory_categories WHERE id = ?', [id]);
  if (existing.length === 0) {
    return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan.' });
  }

  const [itemsUsing] = await pool.query('SELECT COUNT(*) AS count FROM inventory_items WHERE category_id = ?', [id]);
  if (itemsUsing[0].count > 0) {
    return res.status(409).json({ success: false, message: 'Kategori tidak dapat dihapus karena masih digunakan oleh barang.' });
  }

  await pool.query('DELETE FROM inventory_categories WHERE id = ?', [id]);

  res.json({ success: true, message: 'Kategori berhasil dihapus.' });
});

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};
