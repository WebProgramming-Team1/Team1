const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isLoggedIn, isAdmin } = require('../middlewares/authMiddleware');

// 모든 관리자 API는 로그인 + 관리자 권한을 선제로 확인함
router.use(isLoggedIn, isAdmin);

// 좌석 신고 목록 조회
router.get('/reports', adminController.getAllReports);

// 사용 불가 좌석 목록 조회
router.get('/seats/unusable', adminController.getUnusableSeats);

// 지정 좌석 강제 반납
router.post('/seats/:seatId/return', adminController.forceReturnSeat);

// 지정 좌석 사용 불가 상태로 전환
router.post('/seats/:seatId/disable', adminController.disableSeat);

// 이용 불가 좌석을 이용 가능 상태로 전환
router.post('/seats/:seatId/enable', adminController.enableSeat);

module.exports = router;