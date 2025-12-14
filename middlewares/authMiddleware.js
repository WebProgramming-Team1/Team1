/**
 * 요청을 보낸 사용자가 현재 로그인되어 있는지(세션이 유효한지) 검사
 */
exports.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        // 로그인 상태라면 통과
        return next();
    }
    // 비로그인 상태라면 401 Unauthorized 에러와 함께 차단
    return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
};

/**
 * 사용자가 로그인되어 있고, 동시에 역할(Role)이 'ADMIN'인지 검사
 */
exports.isAdmin = (req, res, next) => {
    // 로그인 여부 확인 및유저의 역할이 'ADMIN'인지 확인
    if (req.isAuthenticated && req.isAuthenticated() && req.user.role === 'ADMIN') {
        // 관리자라면 통과
        return next();
    }
    // 관리자가 아니라면 403 Forbidden 에러와 함께 차단
    return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' });
};