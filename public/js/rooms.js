// rooms.js - 방 목록 조회 및 선택
document.addEventListener('DOMContentLoaded', async () => {
    const roomsContainer = document.getElementById('rooms-container');
    const adminBtn = document.getElementById('admin-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // 1. 사용자 정보 확인 (권한 체크)
    try {
        const meRes = await fetch('/auth/me', { credentials: 'same-origin' });

        if (meRes.status === 401) {
            window.location.href = '/login.html';
            return;
        }

        const meData = await meRes.json();

        // 관리자라면 버튼 표시
        if (meData.authenticated && meData.user.role === 'ADMIN') {
            adminBtn.style.display = 'block';
        }

        // 로그아웃 버튼 이벤트 연결
        logoutBtn.addEventListener('click', async () => {
            if (!confirm('로그아웃 하시겠습니까?')) return;
            try {
                const res = await fetch('/auth/logout', { method: 'POST' });
                if (res.ok) {
                    window.location.href = '/login.html';
                }
            } catch (err) {
                console.error(err);
                alert('로그아웃 중 오류가 발생했습니다.');
            }
        });

    } catch (err) {
        console.error('사용자 정보 로드 실패', err);
    }

    // 2. 방 목록 불러오기
    try {
        const res = await fetch('/api/rooms', {
            credentials: 'same-origin',
            headers: { 'Cache-Control': 'no-cache' }
        });

        if (!res.ok) {
            const err = await res.json();
            roomsContainer.innerHTML = `<p style="color:red;">오류: ${err.message}</p>`;
            return;
        }

        const rooms = await res.json();

        if (!rooms || rooms.length === 0) {
            roomsContainer.innerHTML = '<p>사용 가능한 방이 없습니다.</p>';
            return;
        }

        roomsContainer.innerHTML = '';
        rooms.forEach(room => {
            const card = document.createElement('div');
            card.className = 'room-card';
            card.innerHTML = `
                <h3>${room.name}</h3>
                <p>층: ${room.floor}층</p>
                <p>전체: ${room.totalSeats}석 | 이용 중: ${room.totalSeats - room.freeSeats}석</p>
                <p class="seat-stat">잔여 좌석: ${room.freeSeats}석</p>
            `;
            card.addEventListener('click', () => {
                window.location.href = `/seatmap.html?room=${room.id}`;
            });
            roomsContainer.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        roomsContainer.innerHTML = '<p style="color:red;">방 목록을 불러오는 중 오류가 발생했습니다.</p>';
    }
});
