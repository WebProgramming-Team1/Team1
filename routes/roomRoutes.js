const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { isLoggedIn } = require('../middlewares/authMiddleware');

// 열람실 목록
router.get('/', isLoggedIn, roomController.listRooms);

// 특정 열람실 좌석 목록
router.get('/:roomId/seats', isLoggedIn, roomController.getSeatsForRoom);

module.exports = router;