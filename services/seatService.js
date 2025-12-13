const { pool } = require('../config/db');
const seatModel = require('../models/seatModel');
const reservationModel = require('../models/reservationModel');
const seatReportModel = require('../models/seatReportModel');

async function reportProblem(userId, seatId, category, detail) {
    // 내가 사용 중인 좌석 조회
    const active = await reservationModel.findActiveByUser(userId);

    if (!active) {
        const err = new Error('현재 사용 중인 좌석이 없습니다.');
        err.status = 400;
        throw err;
    }

    // 신고 대상 seatId가 내가 쓰는 좌석인지 확인
    if (active.seat_id !== seatId) {
        const err = new Error('현재 사용 중인 좌석에 대해서만 신고할 수 있습니다.');
        err.status = 403;
        throw err;
    }

    // 좌석 존재 여부 확인
    const seat = await seatModel.findById(seatId);
    if (!seat) {
        const err = new Error('존재하지 않는 좌석입니다.');
        err.status = 404;
        throw err;
    }

    // 좌석 신고는 트랜잭션 내에서 처리
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 좌석 신고를 기록
        await conn.query(
            'INSERT INTO seat_reports (seat_id, user_id, category, detail, status) VALUES (?, ?, ?, ?, ?)',
            [seatId, userId, category, detail || '', 'PENDING'],
        );

        // 좌석 상태를 UNUSABLE로 변경
        await conn.query(
            "UPDATE seats SET status = 'UNUSABLE' WHERE id = ?",
            [seatId],
        );

        // 예약 반납 처리
        await conn.query(
            "UPDATE reservations SET status = 'COMPLETED', end_time = NOW() WHERE id = ?",
            [active.id],
        );

        await conn.commit();
    } catch (e) {
        await conn.rollback();
        throw e;
    } finally {
        conn.release();
    }
}

module.exports = {
    reportProblem,
};