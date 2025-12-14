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

// 특정 열람실 좌석 목록을 조회하고, 로그인한 유저가 이용 중인 좌석인지 식별
async function getSeatsForRoom(roomId, userId) {
    // 열람실 존재 여부 확인
    const room = await readingRoomModel.findById(roomId);
    if (!room) {
        const error = new Error('존재하지 않는 열람실입니다.');
        error.status = 404;
        throw error;
    }

    // 해당 열람실의 모든 좌석과 현재 활성화된 예약 정보를 조인해서 가져옴
    const rows = await seatModel.findByRoomWithActiveReservation(roomId);

    let mySeatId = null;

    // 좌석별 상태 업데이트 (NONE: 빈 좌석, ME: 내 좌석, OTHER: 타인 좌석)
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
            usingStatus, // FE에서 로그인한 좌석 구분하기 위한 플래그
        };
    });

    return {
        room: {
            id: room.id,
            name: room.name,
            floor: room.floor,
        },
        seats,
        mySeatId, // 내가 이 열람실에서 이용 중인 좌석이 있다면 ID 반환 (없으면 null)
    };
}

module.exports = {
    listRooms,
    getSeatsForRoom,
};