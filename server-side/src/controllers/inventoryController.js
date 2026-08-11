const db = require('../config/db');

// Ambil semua barang + nama kategorinya
exports.getAllItems = async (req, res) => {
  try {
    const query = `
      SELECT i.id, i.name, i.unit, i.current_stock, i.minimum_stock, c.name as category_name
      FROM inventory_items i
      JOIN inventory_categories c ON i.category_id = c.id
    `;
    const [rows] = await db.query(query);
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Ambil daftar barang yang stoknya di bawah/sama dengan minimum stock
exports.getLowStockItems = async (req, res) => {
  try {
    const query = `
      SELECT i.id, i.name, i.unit, i.current_stock, i.minimum_stock, c.name as category_name
      FROM inventory_items i
      JOIN inventory_categories c ON i.category_id = c.id
      WHERE i.current_stock <= i.minimum_stock
    `;
    const [rows] = await db.query(query);
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Tambah barang baru
exports.createItem = async (req, res) => {
  const { category_id, name, unit, current_stock, minimum_stock } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO inventory_items (category_id, name, unit, current_stock, minimum_stock) VALUES (?, ?, ?, ?, ?)',
      [category_id, name, unit, current_stock, minimum_stock]
    );
    res.status(201).json({ status: 'success', id: result.insertId, message: 'Item created' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Update stok barang (Tambah/Kurang stok)
exports.updateStock = async (req, res) => {
  const { id } = req.params;
  const { amount, type } = req.body; // type: 'in' (tambah) atau 'out' (kurang)

  try {
    const [item] = await db.query('SELECT current_stock FROM inventory_items WHERE id = ?', [id]);
    if (item.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Item not found' });
    }

    let newStock = item[0].current_stock;
    if (type === 'in') {
      newStock += Number(amount);
    } else if (type === 'out') {
      if (newStock < amount) {
        return res.status(400).json({ status: 'error', message: 'Insufficient stock' });
      }
      newStock -= Number(amount);
    } else {
      return res.status(400).json({ status: 'error', message: 'Invalid transaction type' });
    }

    await db.query('UPDATE inventory_items SET current_stock = ? WHERE id = ?', [newStock, id]);
    res.json({ status: 'success', message: 'Stock updated successfully', new_stock: newStock });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};