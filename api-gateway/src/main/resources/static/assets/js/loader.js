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
                if (file === 'header.html') {
                    const loginItem = tempDiv.querySelector('#nav-login-item');
                    const userItem = tempDiv.querySelector('#nav-user-item');
                    const userNameDisplay = tempDiv.querySelector('#display-user-name');

                    const isLoggedIn = localStorage.getItem('isLoggedIn');
                    const userName = localStorage.getItem('userName');

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
                }

                // Lipim pe ecran varianta corectată și păstrăm logica ta originală
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