const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    status: 'success',
  });
});

router.get('/sample-users', (req, res) => {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
  ];
  
  res.json({
    success: true,
    data: users,
    count: users.length,
  });
});

module.exports = router;

