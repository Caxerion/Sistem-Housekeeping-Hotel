const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/', inventoryController.getAllItems);
router.get('/low-stock', inventoryController.getLowStockItems);
router.post('/', inventoryController.createItem);
router.patch('/:id/stock', inventoryController.updateStock);

module.exports = router;