const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');

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

app.use('/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/seats', seatRoutes);

// 기본 페이지는 로그인 화면으로
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});