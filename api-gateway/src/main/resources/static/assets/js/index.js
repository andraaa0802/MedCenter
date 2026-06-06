window.addEventListener('componentsLoaded', () => {
    const header = document.querySelector('#header');
    if (!header) {
        console.error("Eroare: Header-ul nu a fost găsit în DOM!");
        return;
    }


    // ----------------------------------

    const mainScript = document.createElement('script');
    mainScript.src = 'assets/js/main.js';
    mainScript.onload = () => {
        console.log("MedCenter main.js a fost încărcat și inițializat.");
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 600,
                easing: 'ease-in-out',
                once: true,
                mirror: false
            });
        }
    };
    document.body.appendChild(mainScript);
});

// --- LOGICA PENTRU FORMULARUL DE CONTACT ---
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        document.getElementById('contact-loading').classList.remove('d-none');
        document.getElementById('contact-error').classList.add('d-none');
        document.getElementById('contact-success').classList.add('d-none');

        const contactData = {
            name: document.getElementById('contact-name').value,
            email: document.getElementById('contact-email').value,
            subject: document.getElementById('contact-subject').value,
            message: document.getElementById('contact-message').value
        };

        try {
            const response = await fetch('/resources/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });

            document.getElementById('contact-loading').classList.add('d-none');

            if (response.ok) {
                document.getElementById('contact-success').classList.remove('d-none');
                form.reset();
            } else {
                document.getElementById('contact-error').classList.remove('d-none');
                document.getElementById('contact-error').innerText = "Eroare de la server. Mesajul nu a putut fi salvat.";
            }
        } catch (error) {
            console.error("Eroare la trimiterea mesajului:", error);
            document.getElementById('contact-loading').classList.add('d-none');
            document.getElementById('contact-error').classList.remove('d-none');
            document.getElementById('contact-error').innerText = "Nu s-a putut contacta serverul (Network Error).";
        }
    });
});