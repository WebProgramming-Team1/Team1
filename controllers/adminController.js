const { pool } = require('../config/db');
const seatReportModel = require('../models/seatReportModel');
const seatModel = require('../models/seatModel');
const reservationModel = require('../models/reservationModel');

// ---------------------------------------------------------
// [조회] 모든 신고 내역 (히스토리용)
// ---------------------------------------------------------
exports.getAllReports = async (req, res, next) => {
    try {
        const reports = await seatReportModel.findAll();
        res.json(reports);
    } catch (err) { next(err); }
};

// ---------------------------------------------------------
// [조회] 현재 '사용 불가' 상태인 좌석 목록
// 신고된 좌석 + 관리자가 막은 좌석을 한눈에 볼 때 사용
// ---------------------------------------------------------
exports.getUnusableSeats = async (req, res, next) => {
    try {
        // seats 테이블이 메인입니다.
        // 아직 처리되지 않은(PENDING) 신고가 있다면 내용을 붙여서 가져옵니다.
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
                AND sr.status = 'PENDING'  -- 오타 수정됨 (ANDQr -> AND sr)
            WHERE s.status = 'UNUSABLE'
            ORDER BY rr.name ASC, s.seat_number ASC
        `;

        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

// ---------------------------------------------------------
// [액션] 신고 처리 및 좌석 복구
// ---------------------------------------------------------
exports.resolveReport = async (req, res, next) => {
    const reportId = req.params.id;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. 신고 상태를 '해결됨'으로 변경
        await conn.query("UPDATE seat_reports SET status = 'RESOLVED' WHERE id = ?", [reportId]);

        // 2. 연결된 좌석 찾아서 다시 '사용 가능'으로 복구
        const [rows] = await conn.query("SELECT seat_id FROM seat_reports WHERE id = ?", [reportId]);
        if(rows.length > 0) {
            await conn.query("UPDATE seats SET status = 'USABLE' WHERE id = ?", [rows[0].seat_id]);
        }

        await conn.commit();
        res.json({ message: '신고가 처리되었으며 좌석이 복구되었습니다.' });
    } catch (err) {
        await conn.rollback();
        next(err);
    } finally {
        conn.release();
    }
};

// ---------------------------------------------------------
// [액션] 좌석 강제 반납 (사용자 퇴실 처리)
// ---------------------------------------------------------
exports.forceReturnSeat = async (req, res, next) => {
    const seatId = req.params.seatId;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 현재 사용 중인 예약이 있는지 확인
        const [resv] = await conn.query("SELECT id FROM reservations WHERE seat_id = ? AND status = 'ACTIVE'", [seatId]);

        if (resv.length > 0) {
            // 예약 종료 시간(end_time)을 현재로 찍어서 강제 종료
            await conn.query("UPDATE reservations SET status = 'COMPLETED', end_time = NOW() WHERE id = ?", [resv[0].id]);
        }

        // 좌석 상태는 다시 누구나 쓸 수 있게 USABLE로 변경
        await conn.query("UPDATE seats SET status = 'USABLE' WHERE id = ?", [seatId]);

        await conn.commit();
        res.json({ message: '좌석이 강제 반납되었습니다.' });
    } catch (err) {
        await conn.rollback();
        next(err);
    } finally {
        conn.release();
    }
};

// ---------------------------------------------------------
// [액션] 좌석 사용 불가 처리 (관리자 직권 점검 등)
// ---------------------------------------------------------
exports.disableSeat = async (req, res, next) => {
    const seatId = req.params.seatId;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // 혹시 누가 앉아있으면 강제 퇴실시켜야 꼬이지 않음
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

        // 좌석 상태를 'UNUSABLE'로 잠금
        await conn.query("UPDATE seats SET status = 'UNUSABLE' WHERE id = ?", [seatId]);

        await conn.commit();
        res.json({ message: '좌석이 사용 불가 처리되었으며, 기존 사용자는 반납되었습니다.' });
    } catch (err) {
        await conn.rollback();
        next(err);
    } finally {
        conn.release();
    }
};

// ---------------------------------------------------------
// [액션] 좌석 복구 (Enable) - 사용 불가 목록에서 호출
// ---------------------------------------------------------
exports.enableSeat = async (req, res, next) => {
    const seatId = req.params.seatId;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. 좌석 상태 USABLE로 원상복구
        await conn.query("UPDATE seats SET status = 'USABLE' WHERE id = ?", [seatId]);

        // 2. 혹시 이 좌석 때문에 접수된 신고가 있다면, '해결됨' 처리 (일괄 처리)
        await conn.query(
            "UPDATE seat_reports SET status = 'RESOLVED' WHERE seat_id = ? AND status = 'PENDING'",
            [seatId]
        );

        await conn.commit();
        res.json({ message: '좌석이 이용 가능 상태로 복구되었으며, 관련 신고가 처리되었습니다.' });
    } catch (err) {
        await conn.rollback();
        next(err);
    } finally {
        conn.release();
    }
};