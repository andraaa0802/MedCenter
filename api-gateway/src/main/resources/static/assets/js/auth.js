function togglePasswordVisibility(inputId, iconElement) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        iconElement.classList.remove('bi-eye-slash');
        iconElement.classList.add('bi-eye');
    } else {
        input.type = 'password';
        iconElement.classList.remove('bi-eye');
        iconElement.classList.add('bi-eye-slash');
    }
}

function checkUserStatus() {
    const loggedIn = localStorage.getItem('isLoggedIn');
    const userName = localStorage.getItem('userName');
    const userRole = localStorage.getItem('userRole') || 'USER';

    const authBox = document.getElementById('auth-container');
    const profileHeader = document.getElementById('profile-header');
    const profileNameSpan = document.getElementById('profile-user-name');
    const profileRoleText = document.getElementById('profile-role-text');
    const profileIcon = document.getElementById('profile-icon');

    const patientBox = document.getElementById('patient-container');
    const adminBox = document.getElementById('admin-container');
    const doctorBox = document.getElementById('doctor-container');
    const newBookingBtn = document.getElementById('new-booking-btn');

    if (loggedIn === 'true') {
        authBox.classList.add('d-none');
        profileHeader.classList.remove('d-none');
        if (userName) profileNameSpan.innerText = userName;

        if (userRole === 'ADMIN') {
            profileRoleText.innerText = 'Panou de Control Administrator';
            profileIcon.className = 'bi bi-shield-lock-fill';
            adminBox.classList.remove('d-none');
            patientBox.classList.add('d-none');
            doctorBox.classList.add('d-none');
            if (newBookingBtn) newBookingBtn.classList.add('d-none');

            loadAdminMessages();
            loadAllBookingsForAdmin();
        } else if (userRole === 'DOCTOR') {
            profileRoleText.innerText = 'Panou de Control Medic';
            profileIcon.className = 'bi bi-heart-pulse-fill text-primary';
            doctorBox.classList.remove('d-none');
            adminBox.classList.add('d-none');
            patientBox.classList.add('d-none');
            if (newBookingBtn) newBookingBtn.classList.add('d-none');

            loadDoctorAgenda();
            loadDoctorScheduleSettings();
        } else {
            profileRoleText.innerText = 'Panoul tău de pacient';
            profileIcon.className = 'bi bi-person-fill';
            patientBox.classList.remove('d-none');
            adminBox.classList.add('d-none');
            doctorBox.classList.add('d-none');
            if (newBookingBtn) newBookingBtn.classList.remove('d-none');

            loadMyBookings();
            loadMedicalProfile();
        }
    } else {
        authBox.classList.remove('d-none');
        profileHeader.classList.add('d-none');
        adminBox.classList.add('d-none');
        patientBox.classList.add('d-none');
        doctorBox.classList.add('d-none');
    }
}

window.addEventListener('componentsLoaded', () => {
    checkUserStatus();

    const pass1 = document.getElementById('signup-pass');
    const pass2 = document.getElementById('signup-pass-confirm');
    const matchMsg = document.getElementById('password-match-msg');
    const reqBox = document.getElementById('password-requirements');

    function validateRule(elementId, isPassed, text) {
        const element = document.getElementById(elementId);
        if (!element) return;
        element.className = isPassed ? "text-success mb-1" : "text-danger mb-1";
        element.innerHTML = isPassed ? `<i class="bi bi-check-circle-fill"></i> ${text}` : `<i class="bi bi-x-circle-fill"></i> ${text}`;
        return isPassed;
    }

    pass1?.addEventListener('input', () => {
        const val = pass1.value;
        if(val.length > 0) reqBox.classList.remove('d-none');
        else reqBox.classList.add('d-none');

        validateRule('req-length', val.length >= 8, "Minim 8 caractere");
        validateRule('req-uppercase', /[A-Z]/.test(val), "Cel puțin o literă mare");
        validateRule('req-lowercase', /[a-z]/.test(val), "Cel puțin o literă mică");
        validateRule('req-number', /[0-9]/.test(val), "Cel puțin o cifră");
        validateRule('req-special', /[@#$%^&+=!*?]/.test(val), "Un caracter special (@#$%^&+=!*?)");
    });

    pass2?.addEventListener('input', () => {
        if (pass2.value.length > 0) {
            matchMsg.style.display = 'block';
            if (pass1.value === pass2.value) {
                matchMsg.className = "mt-1 small fw-bold text-success";
                matchMsg.innerHTML = '<i class="bi bi-check-circle-fill"></i> Parolele coincid';
            } else {
                matchMsg.className = "mt-1 small fw-bold text-danger";
                matchMsg.innerHTML = '<i class="bi bi-x-circle-fill"></i> Parolele nu coincid';
            }
        } else {
            matchMsg.style.display = 'none';
        }
    });

    const mainScript = document.createElement('script');
    mainScript.src = 'assets/js/main.js';
    document.body.appendChild(mainScript);
});

document.addEventListener('click', (e) => {
    if (e.target.id === 'logout-btn' || e.target.closest('#logout-btn')) {
        localStorage.clear();
        window.location.reload();
    }
});

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Se verifică...';
    btn.disabled = true;

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-pass').value
            })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userId', data.id);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('userRole', data.role);
            if (data.doctorId) localStorage.setItem('doctorId', data.doctorId);
            window.location.reload();
        } else {
            alert("Date de autentificare invalide!");
            btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i> Intră în cont';
            btn.disabled = false;
        }
    } catch (error) {
        alert("Eroare de conexiune cu serverul.");
        btn.disabled = false;
    }
});

document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value;
    const p1 = document.getElementById('signup-pass').value;
    const p2 = document.getElementById('signup-pass-confirm').value;

    if (p1 !== p2) return alert("Parolele nu coincid!");

    const btn = e.target.querySelector('button');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Se creează...';
    btn.disabled = true;

    try {
        const response = await fetch('/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: document.getElementById('signup-name').value, email: email, password: p1, phone: phone })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userId', data.id);
            localStorage.setItem('userName', data.name);
            localStorage.setItem('userRole', data.role);
            alert("Cont creat cu succes!");
            window.location.reload();
        } else {
            const errText = await response.text();
            alert(errText || "Eroare la crearea contului.");
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-person-plus-fill me-2"></i> Creează Cont';
        }
    } catch (error) {
        alert("Eroare de conexiune.");
        btn.disabled = false;
    }
});