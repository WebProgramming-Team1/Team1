const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isLoggedIn, isAdmin } = require('../middlewares/authMiddleware');

// 모든 관리자 API는 로그인 + 관리자 권한 필요
router.use(isLoggedIn, isAdmin);

router.get('/reports', adminController.getAllReports);
router.post('/reports/:id/resolve', adminController.resolveReport);
router.post('/seats/:seatId/return', adminController.forceReturnSeat);
router.post('/seats/:seatId/disable', adminController.disableSeat);
router.get('/seats/unusable', adminController.getUnusableSeats);
router.post('/seats/:seatId/enable', adminController.enableSeat);

module.exports = router;