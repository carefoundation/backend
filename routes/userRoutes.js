const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected - require authentication
router.use(protect);

// GET current logged in user
router.get('/me', userController.getMe);

// GET all users
router.get('/', userController.getAllUsers);

// GET user by ID
router.get('/:id', userController.getUserById);

// PUT update user
router.put('/:id', userController.updateUser);

// DELETE user
router.delete('/:id', userController.deleteUser);

// Admin and Staff routes for user approval
// GET pending users (admin and staff only)
router.get('/pending/approval', authorize('admin', 'staff'), userController.getPendingUsers);

// PUT approve user (admin and staff only)
router.put('/:id/approve', authorize('admin', 'staff'), userController.approveUser);

// DELETE reject user (admin only)
router.delete('/:id/reject', authorize('admin'), userController.rejectUser);

module.exports = router;

