# 웹응용프로그래밍 텀 프로젝트 - PNU 플레이스

---
# API 명세서

---

## 1. 인증 (Auth)

### 1.1. 회원가입

**POST** `/auth/register`

**Body (JSON)**

```json
{
  "username": "test1",
  "name": "홍길동",
  "password": "1234"
}
````

**Response**

* `201 Created`

<!-- end list -->

```json
{
  "message": "회원가입이 완료되었습니다.",
  "user": {
    "id": 1,
    "username": "test1",
    "name": "홍길동",
    "role": "USER"
  }
}
```

* `400 Bad Request` : 필수 값 누락
* `409 Conflict` : 이미 존재하는 아이디

-----

### 1.2. 로그인

**POST** `/auth/login`

**Body (JSON)**

```json
{
  "username": "test1",
  "password": "1234"
}
```

**Response**

* `200 OK` + `Set-Cookie: connect.sid=...`

<!-- end list -->

```json
{
  "message": "로그인 성공",
  "user": {
    "id": 1,
    "username": "test1",
    "name": "홍길동",
    "role": "USER"
  }
}
```

* `401 Unauthorized`

<!-- end list -->

```json
{ "message": "존재하지 않는 아이디입니다." }
```

* 또는

<!-- end list -->

```json
{ "message": "비밀번호가 올바르지 않습니다." }
```

-----

### 1.3. 로그아웃

**POST** `/auth/logout`

* 인증 필요

**Response**

* `200 OK`

<!-- end list -->

```json
{ "message": "로그아웃 되었습니다." }
```

-----

### 1.4. 현재 로그인 사용자 정보

**GET** `/auth/me`

* 인증 필요

**Response**

* 로그인되어 있을 때: `200 OK`

<!-- end list -->

```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "username": "test1",
    "name": "홍길동",
    "role": "USER"
  }
}
```

* 로그인 안 되어 있을 때: `401 Unauthorized`

<!-- end list -->

```json
{ "authenticated": false }
```

-----

## 2\. 열람실 / 좌석 (Rooms / Seats)

### 2.1. 열람실 목록 조회

**GET** `/api/rooms`

* 인증 필요

**Response** (`200 OK`)

```json
[
  {
    "id": 1,
    "name": "4F 노트북열람실-A",
    "floor": 4,
    "totalSeats": 100,
    "usableSeats": 95,
    "freeSeats": 80
  },
  {
    "id": 2,
    "name": "4F 일반열람실",
    "floor": 4,
    "totalSeats": 120,
    "usableSeats": 120,
    "freeSeats": 110
  }
]
```

-----

### 2.2. 특정 열람실의 좌석 목록 조회

**GET** `/api/rooms/:roomId/seats`

* 인증 필요

**Path Params**

* `roomId` : 숫자, 열람실 ID

**Response** (`200 OK`)

```json
{
  "room": {
    "id": 1,
    "name": "4F 노트북열람실-A",
    "floor": 4
  },
  "seats": [
    {
      "id": 10,
      "seatNumber": 201,
      "status": "AVAILABLE",
      "usingStatus": "NONE"
    },
    {
      "id": 11,
      "seatNumber": 202,
      "status": "AVAILABLE",
      "usingStatus": "OTHER"
    },
    {
      "id": 12,
      "seatNumber": 203,
      "status": "UNUSABLE",
      "usingStatus": "NONE"
    }
  ],
  "mySeatId": 11
}
```

**에러**

* `404 Not Found` : 존재하지 않는 열람실

-----

## 3\. 예약 / 좌석 사용 (Reservations)

### 3.1. 내 현재 예약 + 이력 조회

**GET** `/api/reservations/me`

* 인증 필요

**Response** (`200 OK`)

```json
{
  "active": {
    "id": 3,
    "user_id": 1,
    "seat_id": 11,
    "start_time": "2025-12-08 13:00:00",
    "end_time": "2025-12-08 17:00:00",
    "status": "ACTIVE",
    "extend_count": 1
  },
  "history": [
    {
      "id": 3,
      "user_id": 1,
      "seat_id": 11,
      "start_time": "2025-12-08 13:00:00",
      "end_time": "2025-12-08 17:00:00",
      "status": "ACTIVE",
      "extend_count": 1,
      "room_name": "4F 노트북열람실-A",
      "seat_number": 202
    },
    {
      "id": 2,
      "user_id": 1,
      "seat_id": 10,
      "start_time": "...",
      "end_time": "...",
      "status": "RETURNED",
      "extend_count": 0,
      "room_name": "4F 노트북열람실-A",
      "seat_number": 201
    }
  ]
}
```

-----

### 3.2. 좌석 발급

**POST** `/api/reservations`

* 인증 필요

**Body (JSON)**

```json
{ "seatId": 11 }
```

**Response**

* `201 Created`

<!-- end list -->

```json
{
  "message": "좌석이 발급되었습니다.",
  "reservationId": 3
}
```

* `400 Bad Request` 예시

  * 이미 다른 좌석 사용 중인 경우

  <!-- end list -->

  ```json
  { "message": "이미 사용 중인 좌석이 있습니다." }
  ```

  * 해당 좌석이 사용 불가/이미 사용 중인 경우

  <!-- end list -->

  ```json
  { "message": "사용할 수 없는 좌석입니다." }
  ```

-----

### 3.3. 좌석 변경

**POST** `/api/reservations/change`

* 인증 필요
* **동작 방식**: 기존 좌석은 반납 처리되며, 새 좌석에 대한 예약이 생성됩니다. 이때 **기존 예약의 종료 시간(`end_time`)을 그대로 승계**합니다. (시간이 초기화되지 않음)

**Body (JSON)**

```json
{ "targetSeatId": 12 }
```

**Response**

* `200 OK`

<!-- end list -->

```json
{ "message": "좌석이 변경되었습니다." }
```

* `400 Bad Request` 예시

  * 현재 사용 중인 좌석이 없는 경우

  <!-- end list -->

  ```json
  { "message": "현재 사용 중인 좌석이 없습니다." }
  ```

  * 변경 대상 좌석이 현재 사용 중인 좌석과 동일한 경우

  <!-- end list -->

  ```json
  { "message": "이미 사용 중인 좌석입니다." }
  ```

-----

### 3.4. 좌석 연장

**POST** `/api/reservations/:id/extend`

* 인증 필요

**Path Params**

* `id` : 예약 ID

**규칙**

* 본인 예약이어야 함
* `status === 'ACTIVE'`
* `extend_count < 2`

**Response**

* `200 OK`

<!-- end list -->

```json
{ "message": "좌석 사용 시간이 연장되었습니다." }
```

* `400 / 404` : 조건 불충족 시 에러 메시지

-----

### 3.5. 좌석 반납

**POST** `/api/reservations/:id/return`

* 인증 필요

**Path Params**

* `id` : 예약 ID

**Response**

* `200 OK`

<!-- end list -->

```json
{ "message": "좌석이 반납되었습니다." }
```

* `400 / 404` : 이미 종료된 예약, 권한 없음 등

-----

## 4\. 좌석 문제 신고 (Seat Reports)

### 4.1. 좌석 문제 신고

**POST** `/api/seats/:seatId/report`

* 인증 필요
* **현재 내가 사용 중인 좌석**에 대해서만 신고 가능

**Path Params**

* `seatId` : 좌석 ID

**Body (JSON)**

```json
{
  "category": "콘센트",
  "detail": "오른쪽 콘센트가 작동하지 않습니다."
}
```

**Response**

* `201 Created`

<!-- end list -->

```json
{ "message": "좌석 문제가 신고되었습니다." }
```

**동작**

* `seat_reports` 테이블에 신고 기록 생성
* 해당 좌석의 `status` 를 `UNUSABLE` 로 변경
* 해당 좌석에 대한 **사용자의 ACTIVE 예약은 즉시 반납 처리**

-----

## 5\. 관리자 (Admin)

### 5.1. 신고 목록 조회

**GET** `/api/admin/reports`

* 인증 필요 (관리자 권한: `role === 'ADMIN'`)

**Response** (`200 OK`)

```json
[
  {
    "id": 1,
    "seat_id": 12,
    "user_id": 5,
    "category": "broken",
    "detail": "의자 다리가 부러짐",
    "status": "PENDING",
    "created_at": "2025-06-01T09:00:00.000Z",
    "seat_number": 203,
    "room_name": "4F 노트북열람실-A",
    "reporter_name": "홍길동"
  }
]
```

-----

### 5.2. 신고 처리 (좌석 복구)

**POST** `/api/admin/seats/:seatId/enable`

* 인증 필요 (관리자 권한)
* 신고 상태를 `RESOLVED`로 변경하고, 해당 좌석을 다시 `USABLE`로 변경합니다.

**Path Params**

* `id`: 신고 ID

**Response** (`200 OK`)

```json
{ "message": "신고가 처리되었으며 좌석이 복구되었습니다." }
```

-----

### 5.3. 좌석 강제 반납

**POST** `/api/admin/seats/:seatId/return`

* 인증 필요 (관리자 권한)
* 특정 좌석의 현재 사용자를 강제 퇴실(반납) 처리하고 좌석을 `USABLE`로 만듭니다.

**Path Params**

* `seatId`: 좌석 ID

**Response** (`200 OK`)

```json
{ "message": "좌석이 강제 반납되었습니다." }
```

-----

### 5.4. 좌석 강제 사용 불가 처리

**POST** `/api/admin/seats/:seatId/disable`

* 인증 필요 (관리자 권한)
* 특정 좌석을 `UNUSABLE` 상태로 만듭니다.

**Path Params**

* `seatId`: 좌석 ID

**Response** (`200 OK`)

```json
{ "message": "좌석이 사용 불가 처리되었습니다." }
```