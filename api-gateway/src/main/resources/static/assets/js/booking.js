const API_BASE_URL = '/bookings';

const specialtySelect = document.getElementById('specialization');
const doctorSelect = document.getElementById('doctor');
const dateInput = document.getElementById('appointment-date');
const timeSelect = document.getElementById('appointment-time');
const bookingForm = document.getElementById('booking-form');

const daysContainer = document.getElementById('days-container');
const hoursContainer = document.getElementById('hours-container');

// ==============================================================
// GENERATOR VIZUAL ZILE (Simetric: Exact 14 zile valide)
// ==============================================================
async function loadAvailableDays() {
    const doctorId = doctorSelect.value;
    dateInput.value = '';
    timeSelect.value = '';
    hoursContainer.innerHTML = '<div class="text-muted small px-2 py-1 bg-light rounded">Selectează o zi pentru a vedea orele...</div>';

    if (!doctorId) return;

    daysContainer.innerHTML = '<span class="spinner-border spinner-border-sm text-primary"></span><span class="ms-2">Se aliniază calendarul medicului...</span>';

    try {
        const response = await fetch(`/resources/doctors/${doctorId}/schedule`);
        let schedule = [];
        if (response.ok) schedule = await response.json();

        const daysEng = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        const daysRoShort = { 'MONDAY': 'Lun', 'TUESDAY': 'Mar', 'WEDNESDAY': 'Mie', 'THURSDAY': 'Joi', 'FRIDAY': 'Vin', 'SATURDAY': 'Sâm', 'SUNDAY': 'Dum' };
        const monthsRoShort = ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'];

        let dayChecks = [];

        // Obținem data curentă exactă
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        for (let i = 0; i < 150; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);

            const dayNameEng = daysEng[d.getDay()];
            const dayConfig = schedule.find(s => s.dayOfWeek === dayNameEng);

            if (dayConfig && dayConfig.isActive) {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const dateString = `${yyyy}-${mm}-${dd}`;

                const checkPromise = fetch(`/bookings/available-slots?doctorId=${doctorId}&date=${dateString}`)
                    .then(res => res.json())
                    .then(slots => {
                        let validSlots = slots;

                        // Dacă verificăm ziua de azi, ascundem orele deja trecute
                        if (dateString === todayString) {
                            validSlots = slots.filter(slot => {
                                const [slotHour, slotMinute] = slot.split(':').map(Number);
                                if (slotHour > currentHour) return true;
                                if (slotHour === currentHour && slotMinute > currentMinute) return true;
                                return false;
                            });
                        }

                        // Doar dacă au rămas sloturi valide în viitor, arătăm ziua
                        if (validSlots && validSlots.length > 0) {
                            return { date: d, dateString: dateString, dayNameEng: dayNameEng };
                        }
                        return null;
                    })
                    .catch(() => null);

                dayChecks.push(checkPromise);
            }
        }

        const results = await Promise.all(dayChecks);
        let validDays = results.filter(day => day !== null);

        const MAX_DAYS = 21;
        validDays = validDays.slice(0, MAX_DAYS);

        if (validDays.length === 0) {
            daysContainer.innerHTML = '<div class="alert alert-warning py-2 w-100 mb-0"><i class="bi bi-exclamation-triangle me-2"></i>Medicul nu mai are niciun loc disponibil în viitorul apropiat.</div>';
        } else {
            let daysHtml = '';

            validDays.forEach(dayInfo => {
                const d = dayInfo.date;
                const dd = String(d.getDate()).padStart(2, '0');
                const monthName = monthsRoShort[d.getMonth()];
                const dayRo = daysRoShort[dayInfo.dayNameEng];

                daysHtml += `
                    <div class="slot-btn day-btn d-flex flex-column align-items-center justify-content-center" data-date="${dayInfo.dateString}" style="flex: 1 1 12%; min-width: 80px;">
                        <span class="text-uppercase fw-bold text-muted" style="font-size: 0.7rem; letter-spacing: 0.5px;">${dayRo}</span>
                        <span class="fs-3 fw-bolder my-1 lh-1">${dd}</span>
                        <span class="text-uppercase fw-bold" style="font-size: 0.8rem; color: #0d6efd;">${monthName}</span>
                    </div>
                `;
            });

            daysContainer.innerHTML = daysHtml;

            document.querySelectorAll('.day-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');

                    dateInput.value = this.getAttribute('data-date');
                    loadAvailableTimeSlots();
                });
            });
        }
    } catch (error) {
        daysContainer.innerHTML = '<div class="text-danger">Eroare la încărcarea programului.</div>';
    }
}

// ==============================================================
// GENERATOR VIZUAL ORE
// ==============================================================
async function loadAvailableTimeSlots() {
    const doctorId = doctorSelect.value;
    const chosenDate = dateInput.value;

    timeSelect.value = ''; // Resetăm ora
    hoursContainer.innerHTML = '<span class="spinner-border spinner-border-sm text-primary"></span><span class="ms-2">Se caută ore libere...</span>';

    try {
        const response = await fetch(`${API_BASE_URL}/available-slots?doctorId=${doctorId}&date=${chosenDate}`);
        if (response.ok) {
            const slots = await response.json();

            // Obținem data curentă exactă
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const todayString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            let filteredSlots = slots;

            // Dacă s-a selectat ziua de AZI, filtrăm orele din trecut
            if (chosenDate === todayString) {
                filteredSlots = slots.filter(slot => {
                    const [slotHour, slotMinute] = slot.split(':').map(Number);
                    if (slotHour > currentHour) return true;
                    if (slotHour === currentHour && slotMinute > currentMinute) return true;
                    return false; // Ascunde ora dacă a trecut
                });
            }

            if (filteredSlots.length === 0) {
                hoursContainer.innerHTML = '<div class="text-danger px-2 py-1 bg-light rounded"><i class="bi bi-x-circle me-1"></i>Nu mai sunt locuri libere în această zi.</div>';
                return;
            }

            let hoursHtml = '';
            filteredSlots.forEach(slot => {
                hoursHtml += `<div class="slot-btn hour-btn" data-time="${slot}"><i class="bi bi-clock me-1"></i> ${slot}</div>`;

                const option = document.createElement('option');
                option.value = slot;
                option.text = slot;
                timeSelect.appendChild(option);
            });

            hoursContainer.innerHTML = hoursHtml;

            document.querySelectorAll('.hour-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    document.querySelectorAll('.hour-btn').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    timeSelect.value = this.getAttribute('data-time');
                });
            });

        } else {
            hoursContainer.innerHTML = '<div class="text-danger">Eroare la calcularea orelor</div>';
        }
    } catch (error) {
        hoursContainer.innerHTML = '<div class="text-danger">Eroare de conexiune server</div>';
    }
}

doctorSelect.addEventListener('change', loadAvailableDays);

// ==============================================================
// LOGICA DE ÎNCĂRCARE MEDICI
// ==============================================================
async function loadDoctors(specialtyId, doctorIdToSelect = null) {
    doctorSelect.disabled = true;
    doctorSelect.innerHTML = '<option value="" selected disabled>Se încarcă medicii...</option>';
    daysContainer.innerHTML = '<div class="text-muted small px-2 py-1 bg-light rounded">Alege medicul pentru a vedea zilele...</div>';
    hoursContainer.innerHTML = '<div class="text-muted small px-2 py-1 bg-light rounded">Selectează data pentru a vedea orele...</div>';

    try {
        const response = await fetch(`${API_BASE_URL}/doctors-by-specialty/${specialtyId}`);
        if (response.ok) {
            const doctors = await response.json();

            if (doctors.length === 0) {
                doctorSelect.innerHTML = '<option value="" selected disabled>Nu există medici disponibili</option>';
                return;
            }

            let optionsHTML = '<option value="" disabled selected>Selectează medicul...</option>';
            doctors.forEach(doc => {
                optionsHTML += `<option value="${doc.id}">${doc.name} (${doc.consultationPrice} RON)</option>`;
            });

            doctorSelect.innerHTML = optionsHTML;
            doctorSelect.disabled = false;

            if (doctorIdToSelect) {
                let gasit = false;
                Array.from(doctorSelect.options).forEach(opt => {
                    if (opt.value == doctorIdToSelect) {
                        opt.selected = true;
                        gasit = true;
                    }
                });

                if (gasit) {
                    loadAvailableDays();
                }
            }
        }
    } catch (error) {
        doctorSelect.innerHTML = '<option value="" selected disabled>Eroare de încărcare</option>';
    }
}

// ==============================================================
// LOGICA DE ÎNCĂRCARE SPECIALIZĂRI
// ==============================================================
async function loadSpecialties() {
    try {
        const response = await fetch(`${API_BASE_URL}/specialties`);
        if (response.ok) {
            const specialties = await response.json();

            let optionsHTML = '<option value="" disabled>Selectează...</option>';
            specialties.forEach(spec => {
                optionsHTML += `<option value="${spec.id}">${spec.name}</option>`;
            });
            specialtySelect.innerHTML = optionsHTML;

            const urlParams = new URLSearchParams(window.location.search);
            const preSpecId = urlParams.get('specialtyId');
            const preDocId = urlParams.get('doctorId');

            if (preSpecId) {
                specialtySelect.value = preSpecId;
                await loadDoctors(preSpecId, preDocId);
            }
        }
    } catch (error) {
        console.error("Eroare la încărcarea specializărilor:", error);
    }
}

specialtySelect.addEventListener('change', () => {
    loadDoctors(specialtySelect.value);
});

// ==============================================================
// LOGICA DE SUBMIT
// ==============================================================
bookingForm.onsubmit = async (e) => {
    e.preventDefault();

    const doctorId = doctorSelect.value;
    const dateValue = dateInput.value;
    const timeValue = timeSelect.value;
    const userId = localStorage.getItem('userId');

    if (!dateValue) return alert("Te rugăm să selectezi o zi disponibilă apăsând pe un buton!");
    if (!timeValue) return alert("Te rugăm să selectezi ora dorită apăsând pe un buton!");

    if (!userId) {
        alert("Sesiunea a expirat. Te rugăm să te reautentifici în cont.");
        window.location.href = 'account.html';
        return;
    }

    const startTimeISO = `${dateValue}T${timeValue}:00`;
    const submitBtn = bookingForm.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Se înregistrează...';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: parseInt(userId, 10),
                doctorId: parseInt(doctorId,10),
                startTime: startTimeISO
            })
        });

        if (response.ok) {
            alert("Programarea a fost înregistrată cu succes!");
            window.location.href = 'account.html';
        } else {
            const errText = await response.text();
            alert("Eroare: " + (errText || "Nu s-a putut efectua programarea."));
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Confirmă Programarea';
        }
    } catch (error) {
        alert("Eroare de conexiune cu serverul.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Confirmă Programarea';
    }
};

// ==============================================================
// INIȚIALIZARE
// ==============================================================
window.addEventListener('componentsLoaded', () => {
    const mainScript = document.createElement('script');
    mainScript.src = 'assets/js/main.js';
    document.body.appendChild(mainScript);

    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'account.html';
        return;
    }

    loadSpecialties();
});