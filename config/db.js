const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// 데이터베이스 연결 설정
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
});

// 연결 에러 핸들러
pool.on('error', (err) => {
    console.error('Database pool error:', err);
});

/**
 * 공통 쿼리 헬퍼
 */
async function query(sql, params) {
    try {
        const [rows] = await pool.query(sql, params);
        return rows;
    } catch (err) {
        console.error('Query error:', sql, err);
        throw err;
    }
}

module.exports = {
    pool,
    query,
};
