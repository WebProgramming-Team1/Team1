const roomService = require('../services/roomService');

exports.listRooms = async (req, res, next) => {
    try {
        const rooms = await roomService.listRooms();
        res.json(rooms);
    } catch (err) {
        next(err);
    }
};

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