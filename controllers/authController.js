const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const passport = require('passport');


/**
 * POST /auth/register
 * body: { username, password, name }
 */
exports.register = async (req, res, next) => {
    try {
        const { username, password, name } = req.body;

        if (!username || !password || !name) {
            return res.status(400).json({ message: '아이디, 이름, 비밀번호는 필수입니다.' });
        }

        const existing = await userModel.findByUsername(username);
        if (existing) {
            return res.status(409).json({ message: '이미 존재하는 아이디입니다.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userId = await userModel.createUser({ username, passwordHash, name });

        return res.status(201).json({
            message: '회원가입이 완료되었습니다.',
            user: { id: userId, username, name },
        });
    } catch (err) {
        next(err);
    }
};


/**
 * POST /auth/login
 * body: { username, password }
 * 성공 시: { message, user } JSON 반환
 */
exports.login = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);

        if (!user) {
            return res.status(401).json({
                message: info?.message || '로그인에 실패했습니다.',
            });
        }

        req.logIn(user, (err) => {
            if (err) return next(err);

            const safeUser = {
                id: user.id,
                username: user.username,
                name: user.name,
            };

            return res.json({
                message: '로그인 성공',
                user: safeUser,
            });
        });
    })(req, res, next);
};

/**
 * POST /auth/logout
 */
exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        res.json({ message: '로그아웃 되었습니다.' });
    });
};

/**
 * GET /auth/me
 * 현재 로그인 되어있는 유저 정보 반환
 */
exports.getMe = (req, res) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(401).json({ authenticated: false });
    }

    const { id, username, name } = req.user;

    res.json({
        authenticated: true,
        user: { id, username, name },
    });
};
