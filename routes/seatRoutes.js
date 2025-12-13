const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');
const { isLoggedIn } = require('../middlewares/authMiddleware');

// 좌석 예약
router.post('/reserve', isLoggedIn, seatController.reserveSeat);

// 예약 취소
router.post('/cancel/:reservationId', isLoggedIn, seatController.cancelReservation);

// 예약 시간 연장
router.post('/extend/:reservationId', isLoggedIn, seatController.extendReservation);

// 현재 예약 정보 조회
router.get('/my-reservation', isLoggedIn, seatController.getMyReservation);

// 좌석 문제 신고
router.post('/:seatId/report', isLoggedIn, seatController.reportProblem);

module.exports = router;