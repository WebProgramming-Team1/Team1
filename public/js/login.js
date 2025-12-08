// 로그인 폼 처리
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

        // 로그인 성공 후에 열람실 목록 페이지로 이동
        window.location.href = '/rooms.html';
    } catch (err) {
        console.error(err);
        loginError.textContent = '요청 중 오류가 발생했습니다.';
    }
});

// 회원가입 폼 처리
const registerForm = document.getElementById('registerForm');
const registerError = document.getElementById('register-error');
const registerSuccess = document.getElementById('register-success');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    registerError.textContent = '';
    registerSuccess.textContent = '';

    const formData = new FormData(registerForm);
    const data = {
        username: formData.get('username'),
        name: formData.get('name'),
        password: formData.get('password'),
    };

    try {
        const res = await fetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
            registerError.textContent = json.message || '회원가입에 실패했습니다.';
            return;
        }

        registerSuccess.textContent = '회원가입 성공! 이제 위에서 로그인할 수 있습니다.';
        console.log('회원가입 성공:', json);

        // 필요하면 폼 초기화
        // registerForm.reset();
    } catch (err) {
        console.error(err);
        registerError.textContent = '요청 중 오류가 발생했습니다.';
    }
});