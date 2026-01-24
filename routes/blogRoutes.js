const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/', protect, blogController.createBlog);
router.get('/', optionalAuth, blogController.getAllBlogs);
router.get('/:id', optionalAuth, blogController.getBlogById);
router.put('/:id', protect, blogController.updateBlog);
router.delete('/:id', protect, blogController.deleteBlog);

module.exports = router;

