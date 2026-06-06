const qaDatabase = {
    "q1": {
        question: "Cum mă programez?",
        answer: "Pentru a face o programare, trebuie să îți creezi un cont gratuit, apoi să dai click pe butonul albastru <b>'Fă o programare nouă'</b> sau direct din meniul <b>'Servicii'</b>, alegând direct specialistul dorit."
    },
    "q2": {
        question: "Care este programul clinicii?",
        answer: "Clinica MedCenter este deschisă de <b>Luni până Vineri</b>, între orele <b>08:00 și 20:00</b>, însă medicii noștri au program individualizat. Te rugăm să consulți programul specialistului dorit."
    },
    "q3": {
        question: "Ce fac în caz de urgență?",
        answer: "🚨 În caz de urgență medicală majoră, te rugăm să apelezi imediat numărul național <b>112</b>. Clinica noastră nu dispune de o secție de primiri urgențe (UPU)."
    },
    "q4": {
        question: "Cum pot anula o programare?",
        answer: "Poți anula programarea oricând din contul tău, secțiunea <b>'Istoric Programări'</b>, apăsând butonul roșu 'Anulează' din dreptul programării."
    }
};

let chatInitialized = false;

// Funcție atașată global (window) ca să fie găsită mereu de butonul din HTML
window.toggleChat = function() {
    const windowEl = document.getElementById('chatbot-window');
    const iconEl = document.querySelector('#chatbot-btn i');

    if (windowEl.classList.contains('d-none')) {
        windowEl.classList.remove('d-none');
        iconEl.classList.remove('bi-chat-dots-fill');
        iconEl.classList.add('bi-x-lg'); // Iconita de închidere

        if (!chatInitialized) {
            initChat();
        }
    } else {
        windowEl.classList.add('d-none');
        iconEl.classList.remove('bi-x-lg');
        iconEl.classList.add('bi-chat-dots-fill'); // Iconita de chat
    }
};

function initChat() {
    chatInitialized = true;
    addBotMessage("Salut! 👋 Sunt MedBot, asistentul tău virtual. Cu ce informații te pot ajuta astăzi?");
    showOptions();
}

function addBotMessage(text) {
    const messagesDiv = document.getElementById('chatbot-messages');
    const msgHtml = `<div class="chat-msg msg-bot"><span>${text}</span></div>`;
    messagesDiv.insertAdjacentHTML('beforeend', msgHtml);
    scrollToBottom();
}

function addUserMessage(text) {
    const messagesDiv = document.getElementById('chatbot-messages');
    const msgHtml = `<div class="chat-msg msg-user fw-bold">${text}</div>`;
    messagesDiv.insertAdjacentHTML('beforeend', msgHtml);
    scrollToBottom();
}

function showOptions() {
    const messagesDiv = document.getElementById('chatbot-messages');
    let optionsHtml = `<div class="options-container mb-2 w-100" style="animation: fadeIn 0.5s ease-in;">`;

    for (const [key, data] of Object.entries(qaDatabase)) {
        optionsHtml += `<button class="btn btn-outline-primary bg-white text-primary chat-option-btn shadow-sm" onclick="window.handleOptionClick('${key}', this)">${data.question}</button>`;
    }

    optionsHtml += `</div>`;
    messagesDiv.insertAdjacentHTML('beforeend', optionsHtml);
    scrollToBottom();
}

// Funcție atașată global
window.handleOptionClick = function(key, buttonElement) {
    const parentContainer = buttonElement.closest('.options-container');
    parentContainer.style.display = 'none'; // Ascunde butoanele

    const data = qaDatabase[key];
    addUserMessage(data.question);

    const messagesDiv = document.getElementById('chatbot-messages');
    const typingHtml = `<div id="typing-indicator" class="chat-msg msg-bot text-muted small fst-italic">MedBot scrie...</div>`;
    messagesDiv.insertAdjacentHTML('beforeend', typingHtml);
    scrollToBottom();

    setTimeout(() => {
        document.getElementById('typing-indicator').remove();
        addBotMessage(data.answer);

        setTimeout(() => {
            addBotMessage("Te mai pot ajuta și cu altceva?");
            showOptions();
        }, 4000);

    }, 800);
};

function scrollToBottom() {
    const messagesDiv = document.getElementById('chatbot-messages');
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}