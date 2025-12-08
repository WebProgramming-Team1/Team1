const reservationService = require('../services/reservationService');

/**
 * GET /api/reservations/me
 * 내 현재 예약한 좌석 정보와 예약 이력 조회
 */
exports.getMyReservationAndHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const data = await reservationService.getMyReservationAndHistory(userId);
        res.json(data);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/reservations
 * 좌석 발급
 */
exports.reserveSeat = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { seatId } = req.body;
        const id = await reservationService.reserveSeat(userId, seatId);
        res.status(201).json({ message: '좌석이 발급되었습니다.', reservationId: id });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/reservations/change
 * 좌석 변경 (현재 ACTIVE 예약을 다른 좌석으로 이동)
 */
exports.changeSeat = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { targetSeatId } = req.body;
        await reservationService.changeSeat(userId, targetSeatId);
        res.json({ message: '좌석이 변경되었습니다.' });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/reservations/:id/extend
 * 좌석 사용 시간 연장
 */
exports.extendReservation = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const reservationId = Number(req.params.id);
        await reservationService.extendReservation(userId, reservationId);
        res.json({ message: '좌석 사용 시간이 연장되었습니다.' });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/reservations/:id/return
 * 좌석 반납
 */
exports.returnReservation = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const reservationId = Number(req.params.id);
        await reservationService.returnReservation(userId, reservationId);
        res.json({ message: '좌석이 반납되었습니다.' });
    } catch (err) {
        next(err);
    }
};