const adminService = require('../services/adminService');

/**
 * GET /api/admin/reports
 * 모든 신고 내역 조회
 */
exports.getAllReports = async (req, res, next) => {
    try {
        const reports = await adminService.getAllReports();
        res.json(reports);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/admin/seats/unusable
 * 현재 사용 불가 상태인 좌석 목록 조회
 * (신고된 좌석 + 관리자가 막은 좌석)
 */
exports.getUnusableSeats = async (req, res, next) => {
    try {
        const rows = await adminService.getUnusableSeats();
        res.json(rows);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/admin/seats/:seatId/return
 * 좌석 강제 반납 (사용자 퇴실 처리)
 */
exports.forceReturnSeat = async (req, res, next) => {
    try {
        const seatId = req.params.seatId;
        const result = await adminService.forceReturnSeat(seatId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/admin/seats/:seatId/disable
 * 좌석 사용 불가 처리 (관리자 직권 점검 등)
 */
exports.disableSeat = async (req, res, next) => {
    try {
        const seatId = req.params.seatId;
        const result = await adminService.disableSeat(seatId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/admin/seats/:seatId/enable
 * 좌석 복구 (Enable) - 사용 불가 목록에서 호출
 */
exports.enableSeat = async (req, res, next) => {
    try {
        const seatId = req.params.seatId;
        const result = await adminService.enableSeat(seatId);
        res.json(result);
    } catch (err) {
        next(err);
    }
};