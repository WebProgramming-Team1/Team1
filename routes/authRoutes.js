const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 로그인
router.post('/login', authController.login);

// 로그아웃
router.post('/logout', authController.logout);

// 현재 로그인 되어 있는 유저 정보
router.get('/me', authController.getMe);

module.exports = router;
