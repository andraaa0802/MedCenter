async function includeHTML() {
    const elements = document.querySelectorAll("[data-include]");
    for (const el of elements) {
        const file = el.getAttribute("data-include");
        try {
            const response = await fetch(file);
            if (response.ok) {
                const htmlString = await response.text();

                // Creăm un "laborator" invizibil în memorie
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlString;

                // Dacă este header-ul, îl procesăm ÎNAINTE să ajungă pe ecran
                // Dacă este header-ul, îl procesăm ÎNAINTE să ajungă pe ecran
                if (file === 'header.html') {
                    const loginItem = tempDiv.querySelector('#nav-login-item');
                    const userItem = tempDiv.querySelector('#nav-user-item');
                    const userNameDisplay = tempDiv.querySelector('#display-user-name');
                    const appointmentBtn = tempDiv.querySelector('#header-appointment-btn'); // Căutăm butonul

                    const isLoggedIn = localStorage.getItem('isLoggedIn');
                    const userName = localStorage.getItem('userName');
                    const userRole = localStorage.getItem('userRole'); // Preluăm și rolul

                    // 1. Logica pentru meniul de cont (Login vs Panou Control)
                    if (loginItem && userItem) {
                        if (isLoggedIn === 'true') {
                            loginItem.style.setProperty('display', 'none', 'important');
                            userItem.style.setProperty('display', 'block', 'important');
                            if (userNameDisplay && userName && userName !== 'undefined') {
                                userNameDisplay.textContent = userName.split(' ')[0];
                            }
                        } else {
                            loginItem.style.setProperty('display', 'block', 'important');
                            userItem.style.setProperty('display', 'none', 'important');
                        }
                    }

                    // 2. Logica pentru butonul de programare (îl tăiem dacă e Medic/Admin)
                    if (appointmentBtn && (userRole === 'ADMIN' || userRole === 'DOCTOR')) {
                        appointmentBtn.remove();
                    }
                }

                // Lipim pe ecran varianta corectată
                el.innerHTML = tempDiv.innerHTML;
                el.removeAttribute("data-include");
            }
        } catch (err) {
            console.error("Eroare la fragment:", file);
        }
    }
    // DUPĂ ce s-au încărcat toate, declanșăm evenimentul
    window.dispatchEvent(new Event('componentsLoaded'));
}

document.addEventListener("DOMContentLoaded", includeHTML);

// Funcția de marcare a meniului activ
// Funcția corectată pentru meniul activ
function setActiveMenuItem() {
    // 1. Luăm numele paginii (ex: "services.html") și hash-ul (ex: "#contact")
    let currentPath = window.location.pathname.split("/").pop() || 'index.html';
    let currentHash = window.location.hash;

    const navLinks = document.querySelectorAll('#header .navmenu a');

    navLinks.forEach(link => {
        // Curățăm linia albastră de pe toate linkurile
        link.classList.remove('active');

        const href = link.getAttribute('href');
        if (!href) return;

        // Cazul 1: Pagini separate (Servicii, Programare, Contul Meu)
        if (currentPath !== 'index.html' && href.includes(currentPath)) {
            link.classList.add('active');
        }
        // Cazul 2: Secțiunile de pe prima pagină (Acasă, Despre Noi, Contact)
        else if (currentPath === 'index.html') {
            if (currentHash && href.includes(currentHash)) {
                link.classList.add('active'); // Ex: a apăsat pe Contact (#contact)
            } else if (!currentHash && (href === 'index.html' || href === '#hero' || href === '#')) {
                link.classList.add('active'); // Ex: este fix pe pagina de start, sus
            }
        }
    });
}

window.addEventListener('componentsLoaded', () => {
    // 1. Punem linia albastră sub meniu
    setActiveMenuItem();
    setTimeout(setActiveMenuItem, 500);

    // 2. Afișăm conținutul paginii lin (Fade-In)
    const mainContent = document.querySelector('.main');
    if (mainContent) {
        mainContent.classList.add('content-ready');
    }

    // 3. Facem preloader-ul să dispară elegant
    const preloader = document.querySelector('#preloader');
    if (preloader) {
        preloader.style.transition = 'opacity 0.6s ease';
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
            preloader.remove();
        }, 600);
    }

    // ==========================================
        // 4. LOGICA PENTRU DECONECTARE (PENTRU TOATE ECRANELE)
        // ==========================================
        // Folosim querySelectorAll pentru a prinde și butonul de desktop, și clona de mobil
        const logoutButtons = document.querySelectorAll('#btn-logout');

        logoutButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();

                // Ștergem datele
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userId');
                localStorage.removeItem('userName');
                localStorage.removeItem('userRole');

                // Redirecționăm
                window.location.href = 'index.html';
            });
        });
});