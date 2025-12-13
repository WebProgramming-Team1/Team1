exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
};

exports.isAdmin = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user.role === 'ADMIN') {
        return next();
    }
    return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' });
};
