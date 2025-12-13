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


async function reserveSeat(userId, seatId, hours = 4) {
    if (!hours || hours < 1 || hours > 8) {
        const err = new Error('예약 시간은 1시간 이상 8시간 이하여야 합니다.');
        err.status = 400;
        throw err;
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 중복 예약 체크 등 기존 로직 유지...
        const [userActive] = await conn.query(
            "SELECT id FROM reservations WHERE user_id = ? AND status = 'ACTIVE' LIMIT 1 FOR UPDATE",
            [userId],
        );
        if (userActive && userActive.length > 0) {
            const err = new Error('이미 사용 중인 좌석이 있습니다.');
            err.status = 400;
            throw err;
        }

        const [seatRows] = await conn.query('SELECT * FROM seats WHERE id = ? FOR UPDATE', [seatId]);
        const seat = seatRows && seatRows[0];
        if (!seat || seat.status !== 'USABLE') {
            const err = new Error('사용할 수 없는 좌석입니다.');
            err.status = 400;
            throw err;
        }

        const [seatActive] = await conn.query(
            "SELECT id FROM reservations WHERE seat_id = ? AND status = 'ACTIVE' LIMIT 1 FOR UPDATE",
            [seatId],
        );
        if (seatActive && seatActive.length > 0) {
            const err = new Error('이미 사용 중인 좌석입니다.');
            err.status = 400;
            throw err;
        }

        const now = new Date();
        const end = new Date(now.getTime() + hours * 60 * 60 * 1000);
        const startTime = formatDateTime(now);
        const endTime = formatDateTime(end);

        const [insertResult] = await conn.query(
            'INSERT INTO reservations (user_id, seat_id, start_time, end_time) VALUES (?, ?, ?, ?)',
            [userId, seatId, startTime, endTime],
        );

        // 좌석 상태 변경
        await conn.query('UPDATE seats SET status = ? WHERE id = ?', ['RESERVED', seatId]);

        await conn.commit();
        return insertResult.insertId;
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}

// 좌석 변경 (수정됨)
async function changeSeat(userId, targetSeatId) {
    const current = await reservationModel.findActiveByUser(userId);
    if (!current) {
        const err = new Error('현재 사용 중인 좌석이 없습니다.');
        err.status = 400;
        throw err;
    }

    const seat = await seatModel.findById(targetSeatId);
    if (!seat || seat.status !== 'USABLE') {
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

        // 1. 기존 예약 종료 (반납 처리)
        await conn.query(
            "UPDATE reservations SET status = 'COMPLETED' WHERE id = ?",
            [current.id],
        );

        // 기존 좌석 상태 USABLE로 원복
        await conn.query(
            "UPDATE seats SET status = 'USABLE' WHERE id = ?",
            [current.seat_id]
        );

        // [핵심 변경] 2. 새 좌석 예약 생성 (시간 승계)
        // 종료 시간(end_time)을 기존 예약의 end_time으로 설정
        // start_time은 현재 시각
        const prevEndTime = new Date(current.end_time);
        const formatEndTime = formatDateTime(prevEndTime);

        await conn.query(
            'INSERT INTO reservations (user_id, seat_id, start_time, end_time) VALUES (?, ?, NOW(), ?)',
            [userId, targetSeatId, formatEndTime],
        );

        // 3. 새 좌석 상태 RESERVED로 변경
        await conn.query(
            "UPDATE seats SET status = 'RESERVED' WHERE id = ?",
            [targetSeatId]
        );

        await conn.commit();
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}

// 연장 및 반납 로직은 기존 유지...
async function extendReservation(userId, reservationId) {
    const resv = await reservationModel.findById(reservationId);
    // ... (기존 검증 로직) ...
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

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 예약 종료 처리
        await conn.query(
            "UPDATE reservations SET status = 'COMPLETED', end_time = NOW() WHERE id = ?",
            [reservationId]
        );

        // 좌석 상태 USABLE로 변경 (반납 시 필수)
        await conn.query(
            "UPDATE seats SET status = 'USABLE' WHERE id = ?",
            [resv.seat_id]
        );

        await conn.commit();
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}

function formatDateTime(d) {
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

module.exports = {
    getMyReservationAndHistory,
    reserveSeat,
    changeSeat,
    extendReservation,
    returnReservation,
};