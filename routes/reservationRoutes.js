const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { isLoggedIn } = require('../middlewares/authMiddleware');

// 사용자에 대해 로그인 여부 선제적으로 체크
router.use(isLoggedIn);

// 내 예약 + 이력 조회
router.get('/me', reservationController.getMyReservationAndHistory);

// 좌석 발급
router.post('/', reservationController.reserveSeat);

// 좌석 변경
router.post('/change', reservationController.changeSeat);

// 연장
router.post('/:id/extend', reservationController.extendReservation);

// 반납
router.post('/:id/return', reservationController.returnReservation);

module.exports = router;