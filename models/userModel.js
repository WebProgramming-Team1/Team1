const db = require('../config/db');

/**
 * username으로 사용자 조회
 */
async function findByUsername(username) {
    const rows = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    return rows[0] || null;
}

/**
 * id로 사용자 조회
 */
async function findById(id) {
    const rows = await db.query('SELECT * FROM users WHERE id = ?', [id]);

    return rows[0] || null;
}

/**
 * 사용자 생성
 * passwordHash는 bcrypt로 해시된 값임.
 */
async function createUser({ username, passwordHash, name }) {
    const result = await db.query(
        'INSERT INTO users (username, password_hash, name) VALUES (?, ?, ?)',
        [username, passwordHash, name],
    );

    return result.insertId;
}

module.exports = {
    findByUsername,
    findById,
    createUser,
};
