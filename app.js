// app.js (서버의 진입점)
const express = require('express');
const app = express();
const port = 3000;

// 1. 정적 파일 설정: 'public' 폴더 안의 파일들을 클라이언트(브라우저)에 보여줌
app.use(express.static('public'));

// 2. JSON 파싱 설정: 클라이언트가 보내는 JSON 데이터를 해석할 수 있게 함
app.use(express.json());

// 3. 테스트용 REST API (GET 요청)
app.get('/api/hello', (req, res) => {
    // DB 조회 대신 하드코딩된 데이터 전송
    const data = {
        message: "서버에서 보낸 데이터입니다!",
        timestamp: new Date()
    };
    res.json(data); // JSON 형태로 응답 (매우 중요! 평가 항목)
});

// 서버 켜기
app.listen(port, () => {
    console.log(`서버 실행 중: http://localhost:${port}`);
});