const db = require('../config/db');

/**
 * 단일 좌석 조회
 */
async function findById(id) {
    const rows = await db.query('SELECT * FROM seats WHERE id = ?', [id]);
    return rows[0] || null;
}

/**
 * 특정 열람실 좌석 및 해당 좌석의 예약 상태 정보 조회
 */
async function findByRoomWithActiveReservation(roomId) {
    const sql = `
    SELECT
      s.id,
      s.room_id,
      s.seat_number,
      s.status,
      r.id AS reservation_id,
      r.user_id AS reservation_user_id
    FROM seats s
    LEFT JOIN reservations r
      ON r.seat_id = s.id
     AND r.status = 'ACTIVE'
    WHERE s.room_id = ?
    ORDER BY s.seat_number
  `;
    return db.query(sql, [roomId]);
}

/**
 * 좌석 상태 변경
 */
async function updateStatus(seatId, status) {
    await db.query('UPDATE seats SET status = ? WHERE id = ?', [status, seatId]);
}

module.exports = {
    findById,
    findByRoomWithActiveReservation,
    updateStatus,
};