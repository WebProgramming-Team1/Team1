const db = require('../config/db');

async function create(seatId, userId, category, detail) {
    const result = await db.query(
        'INSERT INTO seat_reports (seat_id, user_id, category, detail, status) VALUES (?, ?, ?, ?, ?)',
        [seatId, userId, category, detail, 'PENDING'],
    );
    return result.insertId;
}

/**
 * 특정 좌석의 최근 신고 조회
 */
async function findBySeatId(seatId) {
    const rows = await db.query(
        "SELECT * FROM seat_reports WHERE seat_id = ? ORDER BY created_at DESC LIMIT 1",
        [seatId],
    );
    return rows[0] || null;
}

/**
 * id로 신고 조회
 */
async function findById(id) {
    const rows = await db.query('SELECT * FROM seat_reports WHERE id = ?', [id]);
    return rows[0] || null;
}

/**
 * 신고 상태 변경 (관리자용)
 */
async function updateStatus(id, status) {
    await db.query('UPDATE seat_reports SET status = ? WHERE id = ?', [status, id]);
}

/**
 * 모든 신고 조회 (관리자용)
 */
async function findAll(limit = 50) {
    const sql = `
    SELECT sr.*, s.seat_number, rr.name AS room_name, u.name AS reporter_name
    FROM seat_reports sr
    JOIN seats s ON sr.seat_id = s.id
    JOIN reading_rooms rr ON s.room_id = rr.id
    JOIN users u ON sr.user_id = u.id
    ORDER BY sr.created_at DESC
    LIMIT ?
  `;
    return db.query(sql, [limit]);
}

module.exports = {
    create,
    findBySeatId,
    findById,
    updateStatus,
    findAll,
};