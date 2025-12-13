const seatService = require('../services/seatService');
const seatModel = require('../models/seatModel');
const reservationModel = require('../models/reservationModel');
const reservationService = require('../services/reservationService');

/**
 * POST /api/seats/reserve
 * 좌석 예약
 * body: { seatId, hours }
 */
exports.reserveSeat = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { seatId, hours } = req.body;

        if (!seatId || !hours) {
            return res.status(400).json({ success: false, message: '좌석 ID와 예약 시간은 필수입니다.' });
        }

        if (hours < 1 || hours > 8) {
            return res.status(400).json({ success: false, message: '예약 시간은 1시간 이상 8시간 이하여야 합니다.' });
        }

        // 예약을 트랜잭션으로 수행
        const reservationId = await reservationService.reserveSeat(userId, seatId, hours);

        // 좌석 정보 조회 (응답용)
        const seat = await seatModel.findById(seatId);
        const startTime = new Date();
        const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

        return res.status(201).json({
            message: '좌석이 예약되었습니다.',
            reservationId,
            seatId,
            seatNumber: seat ? seat.seat_number : null,
            startTime,
            endTime,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/seats/cancel/:reservationId
 * 예약 취소
 */
exports.cancelReservation = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { reservationId } = req.params;

        // 예약 조회
        const reservation = await reservationModel.findById(reservationId);
        if (!reservation) {
            const error = new Error('존재하지 않는 예약입니다.');
            error.status = 404;
            throw error;
        }

        // 본인의 예약인지 확인
        if (reservation.user_id !== userId) {
            return res.status(403).json({ success: false, message: '본인의 예약만 취소할 수 있습니다.' });
        }

        if (reservation.status !== 'ACTIVE') {
            return res.status(400).json({ success: false, message: '활성 예약만 취소할 수 있습니다.' });
        }

        // 예약 취소
        await reservationModel.updateStatusAndEndTime(reservationId, 'CANCELLED', reservation.end_time);

        // 좌석 상태를 USABLE로 변경
        await seatModel.updateStatus(reservation.seat_id, 'USABLE');

        return res.json({ message: '예약이 취소되었습니다.' });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/seats/extend/:reservationId
 * 예약 시간 연장
 * body: { hours }
 */
exports.extendReservation = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { reservationId } = req.params;
        const { hours } = req.body;

        if (!hours || hours < 1 || hours > 4) {
            return res.status(400).json({ success: false, message: '연장 시간은 1시간 이상 4시간 이하여야 합니다.' });
        }

        // 예약 조회
        const reservation = await reservationModel.findById(reservationId);
        if (!reservation) {
            const error = new Error('존재하지 않는 예약입니다.');
            error.status = 404;
            throw error;
        }

        // 본인의 예약인지 확인
        if (reservation.user_id !== userId) {
            return res.status(403).json({ success: false, message: '본인의 예약만 연장할 수 있습니다.' });
        }

        if (reservation.status !== 'ACTIVE') {
            return res.status(400).json({ success: false, message: '활성 예약만 연장할 수 있습니다.' });
        }

        // 연장 횟수 제한 (최대 2회)
        if (reservation.extend_count >= 2) {
            return res.status(400).json({ success: false, message: '더 이상 연장할 수 없습니다. (최대 2회)' });
        }

        // 시간 연장
        await reservationModel.extendReservation(reservationId, hours);

        return res.json({ message: '예약이 연장되었습니다.' });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/seats/my-reservation
 * 현재 진행 중인 예약 조회
 */
exports.getMyReservation = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const reservation = await reservationModel.findActiveByUser(userId);

        if (!reservation) {
            return res.json({ hasReservation: false });
        }

        // 좌석 정보와 열람실 정보 조회
        const seat = await seatModel.findById(reservation.seat_id);
        const readingRoomModel = require('../models/readingRoomModel');
        const room = seat ? await readingRoomModel.findById(seat.room_id) : null;

        // 남은 시간(초)
        const now = new Date();
        const endTime = new Date(reservation.end_time);
        const remainingSeconds = Math.max(0, Math.floor((endTime - now) / 1000));

        return res.json({
            hasReservation: true,
            reservation: {
                id: reservation.id,
                seatId: reservation.seat_id,
                seatNumber: seat ? seat.seat_number : null,
                roomId: room ? room.id : null,
                roomName: room ? room.name : null,
                startTime: reservation.start_time,
                endTime: reservation.end_time,
                extendCount: reservation.extend_count,
                remainingSeconds,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/seats/:seatId/report
 * 좌석의 문제를 신고하고 해당 좌석을 사용 불가(UNUSABLE) 상태로 전환
 */
exports.reportProblem = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const seatId = Number(req.params.seatId);
        const { category, detail } = req.body;

        if (!category) {
            return res.status(400).json({ success: false, message: '문제 유형(category)은 필수입니다.' });
        }

        await seatService.reportProblem(userId, seatId, category, detail);
        res.status(201).json({ message: '좌석 문제가 신고되었습니다.' });
    } catch (err) {
        next(err);
    }
};