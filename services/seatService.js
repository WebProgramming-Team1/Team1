const seatModel = require('../models/seatModel');
const seatReportModel = require('../models/seatReportModel');

async function reportProblem(userId, seatId, category, detail) {
    const seat = await seatModel.findById(seatId);
    if (!seat) {
        const err = new Error('존재하지 않는 좌석입니다.');
        err.status = 404;
        throw err;
    }

    // 신고 생성
    await seatReportModel.create(seatId, userId, category, detail || '');

    // 좌석을 UNUSABLE 상태로 변경
    await seatModel.updateStatus(seatId, 'UNUSABLE');
}

module.exports = {
    reportProblem,
};