const seatService = require('../services/seatService');

/**
 * POST /api/seats/:seatId/report
 * 좌석의 문제를 신고하고 해당 좌석을 사용 불가(UNUSABLE) 상태로 전환
 */
exports.reportProblem = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const seatId = Number(req.params.seatId);
        const { category, detail } = req.body;

        if (!category) {
            return res.status(400).json({ message: '문제 유형(category)은 필수입니다.' });
        }

        await seatService.reportProblem(userId, seatId, category, detail);
        res.status(201).json({ message: '좌석 문제가 신고되었습니다.' });
    } catch (err) {
        next(err);
    }
};