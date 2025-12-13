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

        registerSuccess.textContent = '회원가입 성공! 잠시 후 로그인 페이지로 이동합니다...';
        console.log('회원가입 성공:', json);
        registerForm.reset();

        // 2초 뒤 로그인 페이지로 이동
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);

    } catch (err) {
        console.error(err);
        registerError.textContent = '요청 중 오류가 발생했습니다.';
    }
});