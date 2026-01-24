const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/', protect, productController.createProduct);
router.get('/', optionalAuth, productController.getAllProducts);
router.get('/:id', optionalAuth, productController.getProductById);
router.put('/:id', protect, productController.updateProduct);
router.delete('/:id', protect, productController.deleteProduct);

module.exports = router;

