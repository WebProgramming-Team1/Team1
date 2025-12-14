const { pool } = require('../config/db');
const seatReportModel = require('../models/seatReportModel');

// 모든 신고내역 조회
exports.getAllReports = async () => {
    return await seatReportModel.findAll();
};

// 사용 불가상태인 좌석 목록 조회 (신고된 내용이 있다면 포함)
exports.getUnusableSeats = async () => {
    const sql = `
        SELECT 
            s.id AS seat_id,
            s.seat_number,
            s.status,
            rr.name AS room_name,
            sr.category,
            sr.detail,
            sr.created_at AS report_date
        FROM seats s
        JOIN reading_rooms rr ON s.room_id = rr.id
        LEFT JOIN seat_reports sr 
            ON s.id = sr.seat_id 
            AND sr.status = 'PENDING'
        WHERE s.status = 'UNUSABLE'
        ORDER BY rr.name ASC, s.seat_number ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
};

// 좌석 강제 반납 (사용자 퇴실 처리)
exports.forceReturnSeat = async (seatId) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 현재 사용 중인 예약 확인
        const [resv] = await conn.query(
            "SELECT id FROM reservations WHERE seat_id = ? AND status = 'ACTIVE'",
            [seatId]
        );

        if (resv.length > 0) {
            // 강제 종료 처리
            await conn.query(
                "UPDATE reservations SET status = 'COMPLETED', end_time = NOW() WHERE id = ?",
                [resv[0].id]
            );
        }

        // 좌석 상태 USABLE로 변경
        await conn.query("UPDATE seats SET status = 'USABLE' WHERE id = ?", [seatId]);

        await conn.commit();
        return { message: '좌석이 강제 반납되었습니다.' };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// 좌석 사용 불가 처리 (관리자 직권 점검 등)
exports.disableSeat = async (seatId) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 사용자가 있다면 강제 퇴실
        const [activeReservations] = await conn.query(
            "SELECT id FROM reservations WHERE seat_id = ? AND status = 'ACTIVE'",
            [seatId]
        );

        if (activeReservations.length > 0) {
            await conn.query(
                "UPDATE reservations SET status = 'COMPLETED', end_time = NOW() WHERE id = ?",
                [activeReservations[0].id]
            );
        }

        // 좌석 상태 UNUSABLE로 잠금
        await conn.query("UPDATE seats SET status = 'UNUSABLE' WHERE id = ?", [seatId]);

        await conn.commit();
        return { message: '좌석이 사용 불가 처리되었으며, 기존 사용자는 반납되었습니다.' };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

// 이용 불가 상태 좌석을 이용 가능 상태로 복구 (+접수된 신고가 있다면 신고도 같이 해결 상태로)
exports.enableSeat = async (seatId) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 좌석 상태 USABLE로 원상복구
        await conn.query("UPDATE seats SET status = 'USABLE' WHERE id = ?", [seatId]);

        // 관련된 PENDING 신고 일괄 해결 처리
        await conn.query(
            "UPDATE seat_reports SET status = 'RESOLVED' WHERE seat_id = ? AND status = 'PENDING'",
            [seatId]
        );

        await conn.commit();
        return { message: '좌석이 이용 가능 상태로 복구되었으며, 관련 신고가 처리되었습니다.' };
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};