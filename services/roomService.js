const readingRoomModel = require('../models/readingRoomModel');
const seatModel = require('../models/seatModel');
const reservationModel = require('../models/reservationModel'); // 아래에서 만들 것

// 열람실 목록 + 좌석 통계
async function listRooms() {
    const rooms = await readingRoomModel.findAllWithSeatStats();
    return rooms.map((r) => ({
        id: r.id,
        name: r.name,
        floor: r.floor,
        totalSeats: r.totalSeats,
        usableSeats: r.usableSeats,
        freeSeats: r.freeSeats,
    }));
}

// 특정 열람실 좌석 목록 + 로그인 유저 상태
async function getSeatsForRoom(roomId, userId) {
    const room = await readingRoomModel.findById(roomId);
    if (!room) {
        const error = new Error('존재하지 않는 열람실입니다.');
        error.status = 404;
        throw error;
    }

    const rows = await seatModel.findByRoomWithActiveReservation(roomId);

    let mySeatId = null;
    const seats = rows.map((row) => {
        let usingStatus = 'NONE';
        if (row.reservation_user_id) {
            usingStatus = row.reservation_user_id === userId ? 'ME' : 'OTHER';
            if (usingStatus === 'ME') mySeatId = row.id;
        }

        return {
            id: row.id,
            seatNumber: row.seat_number,
            status: row.status,
            usingStatus,
        };
    });

    return {
        room: {
            id: room.id,
            name: room.name,
            floor: room.floor,
        },
        seats,
        mySeatId,
    };
}

module.exports = {
    listRooms,
    getSeatsForRoom,
};