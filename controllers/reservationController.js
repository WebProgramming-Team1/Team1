const reservationService = require('../services/reservationService');

exports.getMyReservationAndHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const data = await reservationService.getMyReservationAndHistory(userId);
        res.json(data);
    } catch (err) {
        next(err);
    }
};

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