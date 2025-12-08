# Team1

## API 명세서

열람실/좌석

GET /api/rooms

응답 예:

[
{
"id": 1,
"name": "4F 노트북열람실-A",
"floor": 4,
"totalSeats": 100,
"usableSeats": 95,
"freeSeats": 80
}
]


GET /api/rooms/:roomId/seats

응답 예:

{
"room": { "id": 1, "name": "4F 노트북열람실-A", "floor": 4 },
"seats": [
{
"id": 10,
"seatNumber": 201,
"status": "AVAILABLE",
"usingStatus": "NONE"   // NONE | ME | OTHER
},
{
"id": 11,
"seatNumber": 202,
"status": "AVAILABLE",
"usingStatus": "OTHER"
}
],
"mySeatId": 10  // 내가 사용 중인 seat id (없으면 null)
}

예약/좌석 사용

GET /api/reservations/me

현재 좌석 + 이력

POST /api/reservations

body: { "seatId": 11 } → 좌석 발급

POST /api/reservations/change

body: { "targetSeatId": 12 }

POST /api/reservations/:id/extend

POST /api/reservations/:id/return

좌석 신고

POST /api/seats/:seatId/report

body: { "category": "콘센트", "detail": "오른쪽 콘센트 안 됨" }