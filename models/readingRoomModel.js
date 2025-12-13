const db = require('../config/db');

/**
 * 열람실 목록 + 좌석 통계
 */
async function findAllWithSeatStats() {
    const sql = `
    SELECT
      rr.id,
      rr.name,
      rr.floor,
      COUNT(s.id) AS totalSeats,
      SUM(CASE WHEN s.status = 'USABLE' THEN 1 ELSE 0 END) AS usableSeats,
      SUM(
        CASE WHEN s.status = 'USABLE'
              AND r_active.id IS NULL THEN 1
             ELSE 0
        END
      ) AS freeSeats
    FROM reading_rooms rr
    LEFT JOIN seats s
      ON s.room_id = rr.id
    LEFT JOIN reservations r_active
      ON r_active.seat_id = s.id
     AND r_active.status = 'ACTIVE'
    GROUP BY rr.id, rr.name, rr.floor
    ORDER BY rr.floor, rr.name
  `;
    return db.query(sql);
}

/**
 * 단일 열람실 조회
 */
async function findById(id) {
    const rows = await db.query('SELECT * FROM reading_rooms WHERE id = ?', [id]);
    return rows[0] || null;
}

/**
 * 열람실 생성 (관리자용)
 */
async function create(name, floor) {
    const result = await db.query(
        'INSERT INTO reading_rooms (name, floor) VALUES (?, ?)',
        [name, floor],
    );
    return result.insertId;
}

module.exports = {
    findAllWithSeatStats,
    findById,
    create,
};