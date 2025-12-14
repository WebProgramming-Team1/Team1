const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');
const { isLoggedIn } = require('../middlewares/authMiddleware');

// 사용자에 대해 로그인 여부 선제적으로 체크
router.use(isLoggedIn);

// 좌석 예약
router.post('/reserve', seatController.reserveSeat);

// 예약 취소
router.post('/cancel/:reservationId', seatController.cancelReservation);

// 예약 시간 연장
router.post('/extend/:reservationId', seatController.extendReservation);

// 현재 예약 정보 조회
router.get('/my-reservation', seatController.getMyReservation);

// 좌석 문제 신고
router.post('/:seatId/report', seatController.reportProblem);

module.exports = router;