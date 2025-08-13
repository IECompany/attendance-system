// backend/routes/salaryRoutes.js (TEMPORARY TEST VERSION)

const express = require('express');
const router = express.Router();

// THIS IS A TEST ROUTE TO SEE IF ANY REQUEST REACHES HERE
router.get('/test-ping', (req, res) => {
    console.log('[Backend Test] Test Ping received at /api/admin/test-ping');
    res.status(200).json({ message: 'Ping successful!' });
});
module.exports = router;