//
let timerInterval = null;

async function fetchMyReservation() {
    try {
        // 기존 타이머 제거 (중복 방지)
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        const res = await fetch('/api/seats/my-reservation', {
            credentials: 'same-origin',
            headers: { 'Cache-Control': 'no-cache' }
        });

        if (res.status === 401) {
            showNoReservation('로그인이 필요합니다.');
            return;
        }
        const data = await res.json();

        if (!data.hasReservation) {
            showNoReservation('현재 이용 중인 좌석이 없습니다.');
            return;
        }

        // 데이터 바인딩
        const r = data.reservation;
        document.getElementById('room-name').textContent = r.roomName || '알 수 없음';

        // 좌석 번호 강조
        const seatNumEl = document.getElementById('seat-number');
        seatNumEl.textContent = r.seatNumber ? `${r.seatNumber}번` : '-';

        // Report 버튼 링크 연결
        const reportBtn = document.getElementById('report-link');
        if (reportBtn) reportBtn.href = `/report.html?seat=${r.seatId}`;

        // 남은 시간 계산
        let remaining = r.remainingSeconds !== undefined
            ? Number(r.remainingSeconds)
            : Math.max(0, Math.floor((new Date(r.endTime) - new Date())/1000));

        const remainingEl = document.getElementById('remaining');
        updateTimerDisplay(remainingEl, remaining);

        // UI 표시
        document.getElementById('reservation-card').style.display = 'block'; // flex 대신 block/grid 등 CSS에 따름
        document.getElementById('no-reservation').style.display = 'none';

        // 버튼 이벤트
        const extendBtn = document.getElementById('btn-extend');
        const returnBtn = document.getElementById('btn-return');

        // [핵심] 연장 버튼
        extendBtn.onclick = async () => {
            if (!confirm('예약을 2시간 연장하시겠습니까?')) return;

            // 1. 즉시 타이머 정지 (깜빡임 방지)
            if (timerInterval) clearInterval(timerInterval);

            try {
                extendBtn.disabled = true;
                extendBtn.textContent = '처리 중...'; // UX 개선

                const resp = await fetch(`/api/seats/extend/${r.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ hours: 2 }),
                });
                const j = await resp.json();

                if (!resp.ok) throw new Error(j.message || '연장 실패');

                alert('이용 시간이 2시간 연장되었습니다.');
                window.location.reload();

            } catch (e) {
                alert(e.message);
                extendBtn.disabled = false;
                extendBtn.textContent = '시간 연장';
                // 실패 시 타이머 재개 필요하면 여기서 다시 fetchMyReservation 호출
                fetchMyReservation();
            }
        };

        // 반납 버튼
        returnBtn.onclick = async () => {
            if (!confirm('정말 반납하시겠습니까?')) return;

            // 1. 즉시 타이머 정지
            if (timerInterval) clearInterval(timerInterval);

            try {
                returnBtn.disabled = true;
                returnBtn.textContent = '처리 중...';

                const resp = await fetch(`/api/seats/cancel/${r.id}`, {
                    method: 'POST',
                    credentials: 'same-origin',
                });

                if (!resp.ok) {
                    const j = await resp.json();
                    throw new Error(j.message || '반납 실패');
                }

                alert('반납이 완료되었습니다.');
                window.location.reload();
            } catch (e) {
                alert(e.message);
                returnBtn.disabled = false;
                returnBtn.textContent = '좌석 반납';
                fetchMyReservation();
            }
        };

        // 타이머 시작
        timerInterval = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                clearInterval(timerInterval);
                remainingEl.textContent = '이용 시간 종료';
                remainingEl.style.color = '#dc3545'; // 붉은색 경고
                return;
            }
            updateTimerDisplay(remainingEl, remaining);
        }, 1000);

    } catch (err) {
        console.error(err);
        showNoReservation('정보를 불러오는 중 오류가 발생했습니다.');
    }
}

function showNoReservation(msg) {
    const noResEl = document.getElementById('no-reservation');
    const cardEl = document.getElementById('reservation-card');
    if(noResEl) {
        noResEl.style.display = 'flex';
        noResEl.querySelector('p').textContent = msg;
    }
    if(cardEl) cardEl.style.display = 'none';
}

function updateTimerDisplay(el, sec) {
    if (sec < 0) sec = 0;
    const h = Math.floor(sec / 3600).toString().padStart(2,'0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2,'0');
    const s = Math.floor(sec % 60).toString().padStart(2,'0');
    el.textContent = `${h}:${m}:${s}`;

    // 10분 미만일 때 긴박함 표시
    if (sec < 600) {
        el.style.color = '#e74c3c';
        el.style.animation = 'pulse 1s infinite';
    } else {
        el.style.color = '#2c3e50';
        el.style.animation = 'none';
    }
}

document.addEventListener('DOMContentLoaded', fetchMyReservation);