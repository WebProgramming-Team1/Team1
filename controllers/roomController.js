const roomService = require('../services/roomService');

/**
 * GET /api/rooms
 * 열람실 목록과 각 좌석 정보를 조회
 */
exports.listRooms = async (req, res, next) => {
    try {
        const rooms = await roomService.listRooms();
        res.json(rooms);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/rooms/:roomId/seats
 * 특정 열람실 좌석 목록과 내 좌석 정보를 조회
 */
exports.getSeatsForRoom = async (req, res, next) => {
    try {
        const roomId = Number(req.params.roomId);
        const userId = req.user.id;

        const data = await roomService.getSeatsForRoom(roomId, userId);
        res.json(data);
    } catch (err) {
        next(err);
    }
};