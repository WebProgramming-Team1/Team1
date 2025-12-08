const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { isLoggedIn } = require('../middlewares/authMiddleware');

// 내 예약 + 이력 조회
router.get('/me', isLoggedIn, reservationController.getMyReservationAndHistory);

// 좌석 발급
router.post('/', isLoggedIn, reservationController.reserveSeat);

// 좌석 변경
router.post('/change', isLoggedIn, reservationController.changeSeat);

// 연장
router.post('/:id/extend', isLoggedIn, reservationController.extendReservation);

// 반납
router.post('/:id/return', isLoggedIn, reservationController.returnReservation);

module.exports = router;