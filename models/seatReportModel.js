const db = require('../config/db');

async function create(seatId, userId, category, detail) {
    const result = await db.query(
        'INSERT INTO seat_reports (seat_id, user_id, category, detail) VALUES (?, ?, ?, ?)',
        [seatId, userId, category, detail],
    );
    return result.insertId;
}

module.exports = {
    create,
};