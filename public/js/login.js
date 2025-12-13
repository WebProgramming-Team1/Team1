//
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('login-error');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';

    const formData = new FormData(loginForm);
    const data = {
        username: formData.get('username'),
        password: formData.get('password'),
    };

    try {
        const res = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            loginError.textContent = json.message || '로그인에 실패했습니다.';
            return;
        }

        const json = await res.json();
        console.log('로그인 성공:', json);

        // 로그인 성공 후 열람실 목록으로 이동
        window.location.href = '/rooms.html';
    } catch (err) {
        console.error(err);
        loginError.textContent = '요청 중 오류가 발생했습니다.';
    }
});