const { pool, query } = require('../config/db');
const reservationModel = require('../models/reservationModel');
const seatModel = require('../models/seatModel');

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

// 좌석 예약 내역 조회
async function getMyReservationAndHistory(userId) {
    const active = await reservationModel.findActiveByUser(userId);
    const history = await reservationModel.findHistoryByUser(userId, 20);
    return { active, history };
}

// 좌석 예약
async function reserveSeat(userId, seatId, hours = 4) {
    if (!hours || hours < 1 || hours > 8) {
        const err = new Error('예약 시간은 1시간 이상 8시간 이하여야 합니다.');
        err.status = 400;
        throw err;
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 로그인 유저 정보 가져옴
        const [userActive] = await conn.query(
            "SELECT id FROM reservations WHERE user_id = ? AND status = 'ACTIVE' LIMIT 1 FOR UPDATE",
            [userId],
        );
        // 로그인한 유저가 이미 예약한 좌석이 있는 상태인지 확인
        if (userActive && userActive.length > 0) {
            const err = new Error('이미 사용 중인 좌석이 있습니다.');
            err.status = 400;
            throw err;
        }

        // 예약하려는 좌석이 존재하는지, 이용 가능한 상태인지 확인
        const [seatRows] = await conn.query('SELECT * FROM seats WHERE id = ? FOR UPDATE', [seatId]);
        const seat = seatRows && seatRows[0];
        if (!seat || seat.status !== 'USABLE') {
            const err = new Error('사용할 수 없는 좌석입니다.');
            err.status = 400;
            throw err;
        }

        // 해당 좌석이 이미 예약된 상태인지 확인
        const [seatActive] = await conn.query(
            "SELECT id FROM reservations WHERE seat_id = ? AND status = 'ACTIVE' LIMIT 1 FOR UPDATE",
            [seatId],
        );
        if (seatActive && seatActive.length > 0) {
            const err = new Error('이미 사용 중인 좌석입니다.');
            err.status = 400;
            throw err;
        }

        // 시작 시간 및 종료 시간 계산
        const now = new Date();
        const end = new Date(now.getTime() + hours * 60 * 60 * 1000);
        const startTime = formatDateTime(now);
        const endTime = formatDateTime(end);

        // 예약 정보 저장
        const [insertResult] = await conn.query(
            'INSERT INTO reservations (user_id, seat_id, start_time, end_time) VALUES (?, ?, ?, ?)',
            [userId, seatId, startTime, endTime],
        );

        // 좌석 상태를 이용 가능에서 이용 중으로 변경 (USABLE -> RESERVED)
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

// 좌석 변경. 현재 이용 중인 좌석을 반납하고, 남은 시간을 유지한 채 새 좌석으로 이동.
async function changeSeat(userId, targetSeatId) {
    // 현재 사용자가 이용 중인 좌석 예약 조회
    const current = await reservationModel.findActiveByUser(userId);
    if (!current) {
        const err = new Error('현재 사용 중인 좌석이 없습니다.');
        err.status = 400;
        throw err;
    }

    // 이동하려는 좌석이 이용 가능한 상태인지 확인
    const seat = await seatModel.findById(targetSeatId);
    if (!seat || seat.status !== 'USABLE') {
        const err = new Error('사용할 수 없는 좌석입니다.');
        err.status = 400;
        throw err;
    }

    // 이동하려는 좌석이 이미 사용 중인지 확인
    const activeOnTarget = await reservationModel.findActiveBySeat(targetSeatId);
    if (activeOnTarget) {
        const err = new Error('이미 사용 중인 좌석입니다.');
        err.status = 400;
        throw err;
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 기존 예약 종료 (반납 처리)
        await conn.query(
            "UPDATE reservations SET status = 'COMPLETED' WHERE id = ?",
            [current.id],
        );

        // 기존 좌석은 이용 가능 상태(USABLE)로 변경
        await conn.query(
            "UPDATE seats SET status = 'USABLE' WHERE id = ?",
            [current.seat_id]
        );

        // 좌석 예약 종료 시간은 기존 예약의 남은 시간을 그대로 유지
        const prevEndTime = new Date(current.end_time);
        const formatEndTime = formatDateTime(prevEndTime);

        await conn.query(
            'INSERT INTO reservations (user_id, seat_id, start_time, end_time) VALUES (?, ?, NOW(), ?)',
            [userId, targetSeatId, formatEndTime],
        );

        // 새 좌석 상태를 예약됨(RESERVED)으로 변경
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

// 좌석 예약 시간 2시간 연장. 최대 2번까지만 가능
async function extendReservation(userId, reservationId) {
    // 현재 이용 중인 좌석 예약에 대한 검증
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

    // 최대 연장 횟수 체크
    if (resv.extend_count >= 2) {
        const err = new Error('최대 연장 횟수를 초과했습니다.');
        err.status = 400;
        throw err;
    }

    // 남은 시간 체크 (2시간 미만일 때만 연장 가능)
    const now = new Date();
    const end = new Date(resv.end_time);
    const remaining = end.getTime() - now.getTime();
    if (remaining >= TWO_HOURS_MS) {
        const err = new Error('잔여 시간이 2시간 미만일 때만 연장할 수 있습니다.');
        err.status = 400;
        throw err;
    }

    // 연장 실행
    await reservationModel.extendReservation(reservationId, 2);
}

// 좌석 반납
async function returnReservation(userId, reservationId) {
    // 현재 이용 중인 좌석 예약에 대한 검증
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

        // 예약 종료 처리하고, 종료 시간을 현재 시간으로 업데이트
        await conn.query(
            "UPDATE reservations SET status = 'COMPLETED', end_time = NOW() WHERE id = ?",
            [reservationId]
        );

        // 좌석 상태를 사용 가능(USABLE)으로 변경
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

// 날짜 포맷 헬퍼 함수
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