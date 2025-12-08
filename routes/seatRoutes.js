const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');
const { isLoggedIn } = require('../middlewares/authMiddleware');

// 좌석 문제 신고
router.post('/:seatId/report', isLoggedIn, seatController.reportProblem);

module.exports = router;