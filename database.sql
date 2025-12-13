-- 1. 열람실 테이블
CREATE TABLE reading_rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    floor INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 사용자 테이블 (role 컬럼 추가)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('USER', 'ADMIN') DEFAULT 'USER', -- 권한 컬럼 추가
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. 좌석 테이블
CREATE TABLE seats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    seat_number INT NOT NULL,
    status ENUM('USABLE', 'RESERVED', 'UNUSABLE') DEFAULT 'USABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES reading_rooms(id),
    UNIQUE KEY (room_id, seat_number)
);

-- 4. 예약 테이블
CREATE TABLE reservations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    seat_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') DEFAULT 'ACTIVE',
    extend_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (seat_id) REFERENCES seats(id)
);

-- 5. 좌석 신고 테이블
CREATE TABLE seat_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    seat_id INT NOT NULL,
    user_id INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    detail TEXT,
    status ENUM('PENDING', 'RESOLVED', 'REJECTED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seat_id) REFERENCES seats(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- [데이터 삽입]

-- 1. 열람실
INSERT INTO reading_rooms (name, floor) VALUES
('1층 열람실', 1), ('2층 열람실', 2), ('3층 열람실', 3);

-- 2. 사용자 (관리자 계정 미리 포함)
--- ID: admin / password: 1234를 가진 관리자 계정
INSERT INTO users (username, password_hash, name, role) VALUES
('admin', '$2b$10$WdHZKeACLY99dSjejI929OLNuEALu9fTy2dmVZfQ7MHxYPsk9YKIG', '관리자', 'ADMIN');


-- 3. 좌석 데이터 (각 열람실 20개씩)
INSERT INTO seats (room_id, seat_number, status)
SELECT 1, ROW_NUMBER() OVER (), 'USABLE' FROM information_schema.columns LIMIT 20;

INSERT INTO seats (room_id, seat_number, status)
SELECT 2, ROW_NUMBER() OVER (), 'USABLE' FROM information_schema.columns LIMIT 20;

INSERT INTO seats (room_id, seat_number, status)
SELECT 3, ROW_NUMBER() OVER (), 'USABLE' FROM information_schema.columns LIMIT 20;