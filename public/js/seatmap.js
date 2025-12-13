//
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');

    if (!roomId) {
        document.getElementById('seatmap-container').innerHTML = '<p>방 ID가 없습니다.</p>';
        return;
    }

    const seatmapContainer = document.getElementById('seatmap-container');
    const hoursInput = document.getElementById('hours-input');
    const reserveBtn = document.getElementById('reserve-btn');
    const hoursLabel = document.querySelector('label[for="hours-input"]');

    let selectedSeatId = null;
    let hasExistingReservation = false;

    // 1. 내 예약 상태 확인
    try {
        const myRes = await fetch('/api/seats/my-reservation', {
            credentials: 'same-origin',
            headers: { 'Cache-Control': 'no-cache' } // 캐시 방지
        });
        const myResData = await myRes.json();

        if (myResData.hasReservation) {
            hasExistingReservation = true;
            reserveBtn.textContent = '좌석 이동하기';
            reserveBtn.style.backgroundColor = '#ff9800';

            hoursInput.style.display = 'none';
            if(hoursLabel) hoursLabel.style.display = 'none';
        }
    } catch (err) {
        console.error('예약 정보 조회 실패', err);
    }

    // 2. 좌석 목록 조회
    try {
        // [수정 포인트] 캐시 방지 옵션 추가
        const res = await fetch(`/api/rooms/${roomId}/seats`, {
            credentials: 'same-origin',
            cache: 'no-store',
            headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache'
            }
        });

        if (res.status === 401) {
            window.location.href = '/login.html';
            return;
        }

        if (!res.ok) {
            const err = await res.json();
            seatmapContainer.innerHTML = `<p style="color:red;">오류: ${err.message}</p>`;
            return;
        }

        const data = await res.json();
        const { room, seats } = data;

        document.getElementById('room-name').textContent = room.name;

        seats.sort((a, b) => a.id - b.id);

        const cols = 5;
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        grid.style.gap = '10px';
        grid.style.marginBottom = '20px';

        seats.forEach((seat, index) => {
            const btn = document.createElement('button');
            btn.textContent = `${seat.seatNumber}`;
            btn.style.padding = '12px';
            btn.style.cursor = 'pointer';
            btn.style.borderRadius = '8px';
            btn.style.border = '1px solid #ddd';
            btn.style.fontWeight = 'bold';
            btn.style.fontSize = '14px';

            if (seat.status === 'USABLE') {
                btn.style.background = '#e8f5e9';
                btn.style.color = '#2e7d32';
                btn.addEventListener('click', () => {
                    // 기존 선택 해제 (DOM 스타일 초기화)
                    grid.querySelectorAll('button').forEach((b, i) => {
                        if (seats[i].status === 'USABLE') {
                            b.style.background = '#e8f5e9';
                            b.style.color = '#2e7d32';
                        }
                    });
                    // 선택 처리
                    selectedSeatId = seat.id;
                    btn.style.background = '#005baa';
                    btn.style.color = '#fff';
                });
            } else if (seat.status === 'RESERVED') {
                if (seat.usingStatus === 'ME') {
                    btn.style.background = '#ff9800';
                    btn.style.color = 'white';
                    btn.textContent += ' (나)';
                } else {
                    btn.style.background = '#ffebee';
                    btn.style.color = '#c62828';
                }
                btn.disabled = true;
                btn.style.cursor = 'not-allowed';
            } else if (seat.status === 'UNUSABLE') {
                // 신고 등으로 인해 사용 불가 상태
                btn.style.background = '#6c757d'; // 짙은 회색
                btn.style.color = '#fff';
                btn.textContent += ' (점검)';
                btn.disabled = true;
                btn.style.cursor = 'not-allowed';
            }

            grid.appendChild(btn);
        });

        seatmapContainer.appendChild(grid);

        reserveBtn.addEventListener('click', async () => {
            if (!selectedSeatId) {
                alert('좌석을 선택하세요.');
                return;
            }

            if (hasExistingReservation) {
                if (!confirm('현재 이용 중인 좌석을 반납하고 이 좌석으로 이동하시겠습니까?')) return;
                try {
                    reserveBtn.disabled = true;
                    const changeRes = await fetch('/api/reservations/change', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'same-origin',
                        body: JSON.stringify({ targetSeatId: selectedSeatId }),
                    });

                    if (!changeRes.ok) {
                        const errData = await changeRes.json();
                        throw new Error(errData.message || '좌석 변경 실패');
                    }

                    alert('좌석이 성공적으로 변경되었습니다!');
                    window.location.href = '/mypage.html';

                } catch (err) {
                    alert('변경 오류: ' + err.message);
                    reserveBtn.disabled = false;
                }
                return;
            }

            const hours = parseInt(hoursInput.value, 10);
            if (!hours || hours < 1 || hours > 8) {
                alert('예약 시간은 1시간 이상 8시간 이하여야 합니다.');
                return;
            }

            try {
                reserveBtn.disabled = true;
                const reserveRes = await fetch('/api/seats/reserve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ seatId: selectedSeatId, hours }),
                });

                if (!reserveRes.ok) {
                    const errData = await reserveRes.json();
                    throw new Error(errData.message || '예약 실패');
                }
                const reserveData = await reserveRes.json();
                alert(`좌석 #${reserveData.seatNumber}이(가) 예약되었습니다!`);
                window.location.href = '/mypage.html';
            } catch (err) {
                alert('예약 오류: ' + err.message);
            } finally {
                reserveBtn.disabled = false;
            }
        });

    } catch (err) {
        console.error(err);
        seatmapContainer.innerHTML = '<p style="color:red;">좌석 정보를 불러오는 중 오류가 발생했습니다.</p>';
    }
});