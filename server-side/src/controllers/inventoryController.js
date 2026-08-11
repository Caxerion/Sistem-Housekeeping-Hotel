const pool = require('../config/db');
const { asyncHandler } = require('../utils/asyncHandler');

const getAllItems = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT 
      ii.id,
      ii.category_id,
      ic.name AS category,
      ii.name,
      ii.unit,
      ii.current_stock,
      ii.minimum_stock,
      CASE WHEN ii.current_stock <= ii.minimum_stock THEN 'Menipis' ELSE 'Aman' END AS status
    FROM inventory_items ii
    JOIN inventory_categories ic ON ic.id = ii.category_id
    ORDER BY ii.id ASC
  `);
  res.json({ success: true, data: rows });
});

const getLowStockItems = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT 
      ii.id,
      ic.name AS category,
      ii.name,
      ii.unit,
      ii.current_stock,
      ii.minimum_stock
    FROM inventory_items ii
    JOIN inventory_categories ic ON ic.id = ii.category_id
    WHERE ii.current_stock <= ii.minimum_stock
    ORDER BY ii.current_stock ASC
  `);
  res.json({ success: true, data: rows });
});

const createItem = asyncHandler(async (req, res) => {
  const { category_id, name, unit, current_stock, minimum_stock } = req.body;

  if (!category_id || !name || !unit) {
    return res.status(400).json({ success: false, message: 'category_id, name, dan unit wajib diisi.' });
  }

  const [result] = await pool.query(
    `INSERT INTO inventory_items (category_id, name, unit, current_stock, minimum_stock)
     VALUES (?, ?, ?, ?, ?)`,
    [category_id, name, unit, current_stock || 0, minimum_stock || 0]
  );

  res.status(201).json({ success: true, message: 'Barang berhasil ditambahkan.', data: { id: result.insertId } });
});

const updateStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (typeof quantity !== 'number' || quantity < 0) {
    return res.status(400).json({ success: false, message: 'Quantity harus angka non-negatif.' });
  }

  const [existing] = await pool.query(`SELECT id FROM inventory_items WHERE id = ?`, [id]);
  if (existing.length === 0) {
    return res.status(404).json({ success: false, message: 'Barang tidak ditemukan.' });
  }

  await pool.query(`UPDATE inventory_items SET current_stock = ? WHERE id = ?`, [quantity, id]);

  res.json({ success: true, message: 'Stok berhasil diperbarui.' });
});

const addStock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, note } = req.body;

  if (typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ success: false, message: 'Quantity harus angka positif.' });
  }

  const [existing] = await pool.query(`SELECT id, current_stock FROM inventory_items WHERE id = ?`, [id]);
  if (existing.length === 0) {
    return res.status(404).json({ success: false, message: 'Barang tidak ditemukan.' });
  }

  const newStock = existing[0].current_stock + quantity;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(`UPDATE inventory_items SET current_stock = ? WHERE id = ?`, [newStock, id]);

    await connection.query(
      `INSERT INTO inventory_stock_logs (item_id, employee_id, type, quantity, note)
       VALUES (?, ?, 'in', ?, ?)`,
      [id, req.user.employee_id, quantity, note || null]
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  res.json({ success: true, message: 'Stok berhasil ditambah.', data: { current_stock: newStock } });
});

const createTaking = asyncHandler(async (req, res) => {
  const { employee_id, note, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Items tidak boleh kosong.' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [takingResult] = await connection.query(
      `INSERT INTO inventory_takings (employee_id, note) VALUES (?, ?)`,
      [employee_id || req.user.employee_id, note || null]
    );
    const takingId = takingResult.insertId;

    for (const item of items) {
      const { item_id, quantity } = item;

      if (!item_id || typeof quantity !== 'number' || quantity <= 0) {
        throw new Error('Setiap item harus memiliki item_id dan quantity positif.');
      }

      const [itemRows] = await connection.query(`SELECT id, current_stock FROM inventory_items WHERE id = ?`, [item_id]);
      if (itemRows.length === 0) {
        throw new Error(`Barang ID ${item_id} tidak ditemukan.`);
      }

      if (itemRows[0].current_stock < quantity) {
        throw new Error(`Stok ${itemRows[0].name} tidak mencukupi. Tersedia: ${itemRows[0].current_stock}`);
      }

      const newStock = itemRows[0].current_stock - quantity;
      await connection.query(`UPDATE inventory_items SET current_stock = ? WHERE id = ?`, [newStock, item_id]);

      await connection.query(
        `INSERT INTO inventory_taking_items (taking_id, item_id, quantity) VALUES (?, ?, ?)`,
        [takingId, item_id, quantity]
      );

      await connection.query(
        `INSERT INTO inventory_stock_logs (item_id, employee_id, type, quantity, note)
         VALUES (?, ?, 'out', ?, ?)`,
        [item_id, employee_id || req.user.employee_id, quantity, `Pengambilan #${takingId}`]
      );
    }

    await connection.commit();

    res.status(201).json({ success: true, message: 'Pengambilan barang berhasil dicatat.', data: { id: takingId } });
  } catch (err) {
    await connection.rollback();
    return res.status(400).json({ success: false, message: err.message });
  } finally {
    connection.release();
  }
});

const getTakings = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT 
      it.id,
      it.taken_at,
      it.note,
      e.full_name AS employee_name,
      GROUP_CONCAT(DISTINCT CONCAT(ii.name, ' (', iti.quantity, ' ', ii.unit, ')')
        ORDER BY ii.name SEPARATOR ', ') AS items_summary
    FROM inventory_takings it
    JOIN employees e ON e.id = it.employee_id
    LEFT JOIN inventory_taking_items iti ON iti.taking_id = it.id
    LEFT JOIN inventory_items ii ON ii.id = iti.item_id
    GROUP BY it.id, it.taken_at, it.note, e.full_name
    ORDER BY it.taken_at DESC
  `);
  res.json({ success: true, data: rows });
});

module.exports = {
  getAllItems,
  getLowStockItems,
  createItem,
  updateStock,
  addStock,
  createTaking,
  getTakings,
};
