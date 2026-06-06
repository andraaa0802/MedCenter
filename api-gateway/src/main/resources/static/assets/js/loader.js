async function includeHTML() {
    const elements = document.querySelectorAll("[data-include]");
    for (const el of elements) {
        const file = el.getAttribute("data-include");
        try {
            const response = await fetch(file);
            if (response.ok) {
                const htmlString = await response.text();

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlString;

                 if (file === 'header.html') {
                    const loginItem = tempDiv.querySelector('#nav-login-item');
                    const userItem = tempDiv.querySelector('#nav-user-item');
                    const userNameDisplay = tempDiv.querySelector('#display-user-name');
                    const appointmentBtn = tempDiv.querySelector('#header-appointment-btn');

                    const isLoggedIn = localStorage.getItem('isLoggedIn');
                    const userName = localStorage.getItem('userName');
                    const userRole = localStorage.getItem('userRole');

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

                    if (appointmentBtn && (userRole === 'ADMIN' || userRole === 'DOCTOR')) {
                        appointmentBtn.remove();
                    }
                }

                el.innerHTML = tempDiv.innerHTML;
                el.removeAttribute("data-include");
            }
        } catch (err) {
            console.error("Eroare la fragment:", file);
        }
    }
    window.dispatchEvent(new Event('componentsLoaded'));
}

document.addEventListener("DOMContentLoaded", includeHTML);

function setActiveMenuItem() {
    let currentPath = window.location.pathname.split("/").pop() || 'index.html';
    let currentHash = window.location.hash;

    const navLinks = document.querySelectorAll('#header .navmenu a');

    navLinks.forEach(link => {
        link.classList.remove('active');

        const href = link.getAttribute('href');
        if (!href) return;

        if (currentPath !== 'index.html' && href.includes(currentPath)) {
            link.classList.add('active');
        }
        else if (currentPath === 'index.html') {
            if (currentHash && href.includes(currentHash)) {
                link.classList.add('active');
            } else if (!currentHash && (href === 'index.html' || href === '#hero' || href === '#')) {
                link.classList.add('active');
            }
        }
    });
}

window.addEventListener('componentsLoaded', () => {
    setActiveMenuItem();
    setTimeout(setActiveMenuItem, 500);

    const mainContent = document.querySelector('.main');
    if (mainContent) {
        mainContent.classList.add('content-ready');
    }

    const preloader = document.querySelector('#preloader');
    if (preloader) {
        preloader.style.transition = 'opacity 0.6s ease';
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
            preloader.remove();
        }, 600);
    }

    const logoutButtons = document.querySelectorAll('#btn-logout');

        logoutButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();

                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userId');
                localStorage.removeItem('userName');
                localStorage.removeItem('userRole');

                window.location.href = 'index.html';
            });
        });
});