const db = require('../config/db');

/**
 * user의 ACTIVE 예약 1개
 */
async function findActiveByUser(userId) {
    const rows = await db.query(
        "SELECT * FROM reservations WHERE user_id = ? AND status = 'ACTIVE' LIMIT 1",
        [userId],
    );
    return rows[0] || null;
}

/**
 * seat에 ACTIVE 예약이 있는지
 */
async function findActiveBySeat(seatId) {
    const rows = await db.query(
        "SELECT * FROM reservations WHERE seat_id = ? AND status = 'ACTIVE' LIMIT 1",
        [seatId],
    );
    return rows[0] || null;
}

/**
 * id로 예약 조회
 */
async function findById(id) {
    const rows = await db.query('SELECT * FROM reservations WHERE id = ?', [id]);
    return rows[0] || null;
}

/**
 * 새 예약 생성
 */
async function create(userId, seatId, startTime, endTime) {
    const result = await db.query(
        'INSERT INTO reservations (user_id, seat_id, start_time, end_time) VALUES (?, ?, ?, ?)',
        [userId, seatId, startTime, endTime],
    );
    return result.insertId;
}

/**
 * 예약 상태 및 좌석 만료 시간 업데이트
 */
async function updateStatusAndEndTime(id, status, endTime) {
    await db.query('UPDATE reservations SET status = ?, end_time = ? WHERE id = ?', [
        status,
        endTime,
        id,
    ]);
}

/**
 * 좌석 이용 시간 연장
 */
async function extendReservation(id, hours) {
    await db.query(
        'UPDATE reservations SET end_time = DATE_ADD(end_time, INTERVAL ? HOUR), extend_count = extend_count + 1 WHERE id = ?',
        [hours, id],
    );
}

/**
 * 특정 user의 예약 이력 (최근순)
 */
async function findHistoryByUser(userId, limit = 20) {
    const sql = `
    SELECT r.*, rr.name AS room_name, s.seat_number
    FROM reservations r
    JOIN seats s ON r.seat_id = s.id
    JOIN reading_rooms rr ON s.room_id = rr.id
    WHERE r.user_id = ?
    ORDER BY r.start_time DESC
    LIMIT ?
  `;
    return db.query(sql, [userId, limit]);
}

module.exports = {
    findActiveByUser,
    findActiveBySeat,
    findById,
    create,
    updateStatusAndEndTime,
    extendReservation,
    findHistoryByUser,
};