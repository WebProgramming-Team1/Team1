//
document.addEventListener('DOMContentLoaded', async () => {
    // 1. URL 파라미터 확인 (백업용)
    const params = new URLSearchParams(window.location.search);
    let targetSeatId = params.get('seat');

    const seatInfoArea = document.getElementById('seat-info-area');
    const seatInfoText = document.getElementById('seat-info-text');
    const reportForm = document.getElementById('report-form');
    const reportMessage = document.getElementById('message');

    // 2. 정확한 좌석 정보 및 검증을 위해 '내 예약 정보' API 호출
    try {
        const res = await fetch('/api/seats/my-reservation', {
            credentials: 'same-origin',
            headers: { 'Cache-Control': 'no-cache' }
        });
        const data = await res.json();

        if (data.hasReservation) {
            // [기능 추가] 화면에 좌석 정보 표시
            seatInfoArea.style.display = 'block';
            seatInfoText.innerHTML = `
                <strong>${data.reservation.roomName}</strong> - 
                <strong>좌석 #${data.reservation.seatNumber}</strong><br>
                <span style="font-size:0.9em; color:#666;">(ID: ${data.reservation.seatId})</span>
            `;

            // API 호출을 위한 seatId를 내 예약 정보에서 직접 가져옴 (가장 정확함)
            targetSeatId = data.reservation.seatId;
        } else {
            // 예약이 없는데 신고 페이지에 온 경우
            seatInfoArea.style.display = 'block';
            seatInfoArea.style.backgroundColor = '#f8d7da';
            seatInfoArea.style.borderLeftColor = '#dc3545';
            seatInfoText.innerHTML = '<strong style="color:#721c24;">현재 이용 중인 좌석이 없습니다.</strong>';

            // 폼 비활성화
            reportForm.querySelector('button').disabled = true;
            reportForm.querySelector('select').disabled = true;
            reportForm.querySelector('textarea').disabled = true;
        }

    } catch (err) {
        console.error(err);
        seatInfoText.textContent = '좌석 정보를 불러오는 중 오류가 발생했습니다.';
    }

    // 3. 신고 제출 핸들러
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        reportMessage.style.display = 'none';
        reportMessage.textContent = '';

        if (!targetSeatId) {
            reportMessage.className = 'message error';
            reportMessage.textContent = '신고할 좌석 정보가 없습니다.';
            return;
        }

        const category = document.getElementById('category').value;
        const detail = document.getElementById('detail').value;

        if (!confirm('신고를 접수하시겠습니까?\n신고 시 해당 좌석은 즉시 반납 처리되며, 사용 불가 상태로 변경됩니다.')) {
            return;
        }

        try {
            const submitBtn = document.getElementById('submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = '처리 중...';

            const res = await fetch(`/api/seats/${targetSeatId}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ category, detail }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.message || '신고 처리에 실패했습니다.');
            }

            // 성공 처리
            reportMessage.className = 'message success';
            reportMessage.textContent = '신고가 완료되었으며 좌석이 반납되었습니다.';

            // 잠시 후 메인으로 이동
            setTimeout(() => {
                window.location.href = '/rooms.html';
            }, 2000);

        } catch (err) {
            console.error(err);
            reportMessage.className = 'message error';
            reportMessage.textContent = err.message;
            document.getElementById('submit-btn').disabled = false;
            document.getElementById('submit-btn').textContent = '신고 및 좌석 반납';
        }
    });
});