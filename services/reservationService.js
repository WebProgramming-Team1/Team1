const { pool, query } = require('../config/db');
const reservationModel = require('../models/reservationModel');
const seatModel = require('../models/seatModel');

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

async function getMyReservationAndHistory(userId) {
    const active = await reservationModel.findActiveByUser(userId);
    const history = await reservationModel.findHistoryByUser(userId, 20);
    return { active, history };
}

// 좌석 발급
async function reserveSeat(userId, seatId) {
    // 해당 좌석이 ACTIVE 예약 상태라면 불가
    const existing = await reservationModel.findActiveByUser(userId);
    if (existing) {
        const err = new Error('이미 사용 중인 좌석이 있습니다.');
        err.status = 400;
        throw err;
    }

    const seat = await seatModel.findById(seatId);
    if (!seat || seat.status !== 'AVAILABLE') {
        const err = new Error('사용할 수 없는 좌석입니다.');
        err.status = 400;
        throw err;
    }

    const activeOnSeat = await reservationModel.findActiveBySeat(seatId);
    if (activeOnSeat) {
        const err = new Error('이미 사용 중인 좌석입니다.');
        err.status = 400;
        throw err;
    }

    const now = new Date();
    const end = new Date(now.getTime() + FOUR_HOURS_MS);

    const startTime = formatDateTime(now);
    const endTime = formatDateTime(end);

    const id = await reservationModel.create(userId, seatId, startTime, endTime);
    return id;
}

// 좌석 변경. 트랜잭션 내에서 이루어 져야 함.
async function changeSeat(userId, targetSeatId) {
    const current = await reservationModel.findActiveByUser(userId);
    if (!current) {
        const err = new Error('현재 사용 중인 좌석이 없습니다.');
        err.status = 400;
        throw err;
    }

    const seat = await seatModel.findById(targetSeatId);
    if (!seat || seat.status !== 'AVAILABLE') {
        const err = new Error('사용할 수 없는 좌석입니다.');
        err.status = 400;
        throw err;
    }

    const activeOnTarget = await reservationModel.findActiveBySeat(targetSeatId);
    if (activeOnTarget) {
        const err = new Error('이미 사용 중인 좌석입니다.');
        err.status = 400;
        throw err;
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 기존 좌석 예약 종료
        await conn.query(
            "UPDATE reservations SET status = 'RETURNED', end_time = NOW() WHERE id = ?",
            [current.id],
        );

        // 새 좌석 예약 생성. 좌석 시작시간은 현재 시각이고 4시간 유지.
        await conn.query(
            'INSERT INTO reservations (user_id, seat_id, start_time, end_time) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 4 HOUR))',
            [userId, targetSeatId],
        );

        await conn.commit();
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}

// 이용 중인 좌석 시간 연장
async function extendReservation(userId, reservationId) {
    const resv = await reservationModel.findById(reservationId);
    if (!resv || resv.user_id !== userId) {
        const err = new Error('해당 예약이 없거나 권한이 없습니다.');
        err.status = 404;
        throw err;
    }

    if (resv.status !== 'ACTIVE') {
        const err = new Error('ACTIVE 상태의 예약만 연장할 수 있습니다.');
        err.status = 400;
        throw err;
    }

    if (resv.extend_count >= 4) {
        const err = new Error('최대 연장 횟수를 초과했습니다.');
        err.status = 400;
        throw err;
    }

    const now = new Date();
    const end = new Date(resv.end_time);
    const remaining = end.getTime() - now.getTime();
    if (remaining >= TWO_HOURS_MS) {
        const err = new Error('잔여 시간이 2시간 미만일 때만 연장할 수 있습니다.');
        err.status = 400;
        throw err;
    }

    await reservationModel.extendReservation(reservationId, 4);
}

// 이용 중인 좌석 반납
async function returnReservation(userId, reservationId) {
    const resv = await reservationModel.findById(reservationId);
    if (!resv || resv.user_id !== userId) {
        const err = new Error('해당 예약이 없거나 권한이 없습니다.');
        err.status = 404;
        throw err;
    }
    if (resv.status !== 'ACTIVE') {
        const err = new Error('이미 종료된 예약입니다.');
        err.status = 400;
        throw err;
    }

    await reservationModel.updateStatusAndEndTime(
        reservationId,
        'RETURNED',
        formatDateTime(new Date()),
    );
}

// DATETIME 포맷 (YYYY-MM-DD HH:MM:SS)
function formatDateTime(d) {
    const pad = (n) => (n < 10 ? '0' + n : n);
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
}

module.exports = {
    getMyReservationAndHistory,
    reserveSeat,
    changeSeat,
    extendReservation,
    returnReservation,
};