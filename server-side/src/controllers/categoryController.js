const db = require('../config/db');

exports.getAllCategories = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM inventory_categories');
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  const { name, description } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO inventory_categories (name, description) VALUES (?, ?)',
      [name, description]
    );
    res.status(201).json({ status: 'success', id: result.insertId, message: 'Category created' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};