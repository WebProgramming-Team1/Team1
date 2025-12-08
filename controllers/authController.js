const passport = require('passport');

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
