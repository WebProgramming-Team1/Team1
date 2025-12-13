const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');

// 프로세스 전역 예외 로깅
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION', reason);
});
const dotenv = require('dotenv');
dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 세션
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'pnu-seat-secret',
        resave: false,
        saveUninitialized: false,
    }),
);

// passport 초기화
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// HTML/CSS/JS
app.use(express.static(path.join(__dirname, 'public')));

// 라우트 등록
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const seatRoutes = require('./routes/seatRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/admin', adminRoutes);

// 기본 페이지는 로그인 화면으로
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// 404 핸들러
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not Found', status: 404 });
});

// 에러 핸들러 (응답 포맷 통일)
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    console.error(`[${status}] ${message}`);

    const payload = {
        success: false,
        message,
        status,
    };

    if (process.env.NODE_ENV === 'development') {
        payload.error = err && err.stack ? err.stack : err;
    }

    res.status(status).json(payload);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});