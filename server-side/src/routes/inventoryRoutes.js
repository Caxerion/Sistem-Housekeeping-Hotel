const express = require('express');
const router = express.Router();
const {
  getAllItems,
  getLowStockItems,
  createItem,
  updateStock,
  addStock,
  createTaking,
  getTakings,
} = require('../controllers/inventoryController');
const { verifyToken, verifyRole } = require('../middlewares/auth');

router.use(verifyToken);
router.use(verifyRole(['admin', 'staff']));

router.get('/', getAllItems);
router.get('/low-stock', getLowStockItems);
router.post('/', createItem);
router.patch('/:id/stock', updateStock);
router.post('/items/:id/add-stock', addStock);
router.post('/takings', createTaking);
router.get('/takings', getTakings);

module.exports = router;
