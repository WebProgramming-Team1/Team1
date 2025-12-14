const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { isLoggedIn } = require('../middlewares/authMiddleware');

// 사용자에 대해 로그인 여부 선제적으로 체크
router.use(isLoggedIn);

// 열람실 목록
router.get('/', roomController.listRooms);

// 특정 열람실 좌석 목록
router.get('/:roomId/seats', roomController.getSeatsForRoom);

module.exports = router;