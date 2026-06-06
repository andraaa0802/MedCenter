const DAYS_RO = { 'MONDAY': 'Luni', 'TUESDAY': 'Marți', 'WEDNESDAY': 'Miercuri', 'THURSDAY': 'Joi', 'FRIDAY': 'Vineri' };

async function loadDoctorAgenda() {
    const doctorId = localStorage.getItem('doctorId');
    const tbody = document.getElementById('doctor-agenda-table');
    if (!doctorId || !tbody) return;

    try {
        const response = await fetch(`/bookings/doctor/${doctorId}`);
        if (response.ok) {
            const bookings = await response.json();

            if (bookings.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Nu ai nicio programare în agendă.</td></tr>`;
                return;
            }

            bookings.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            let rowsHtml = '';

            for (const b of bookings) {
                const dateStart = new Date(b.startTime);
                const dateEnd = new Date(b.endTime);
                const formattedDate = dateStart.toLocaleDateString('ro-RO') + ' ' + dateStart.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
                const durationMinutes = Math.round((dateEnd - dateStart) / 60000);

                let statusBadge = '', actionButton = '', rowClass = '';

                if (b.status === 'CANCELLED') {
                    statusBadge = `<span class="badge bg-danger">Anulată</span>`;
                    actionButton = `<button class="btn btn-sm btn-outline-secondary" disabled>Anulată</button>`;
                    rowClass = 'table-light text-muted';
                } else if (b.status === 'COMPLETED') {
                    statusBadge = `<span class="badge bg-primary"><i class="bi bi-check2-all"></i> Finalizată</span>`;
                    actionButton = `<button class="btn btn-sm btn-outline-secondary" disabled>Finalizată</button>`;
                    rowClass = 'table-light text-muted';
                } else if (b.status === 'BLOCKED') {
                    statusBadge = `<span class="badge bg-warning text-dark"><i class="bi bi-cup-hot"></i> Pauză / Blocat</span>`;
                    actionButton = `<button class="btn btn-sm btn-outline-danger" onclick="cancelBooking(${b.id}, 'doctor')">Deblochează</button>`;
                    rowClass = 'table-warning';
                } else {
                    statusBadge = `<span class="badge bg-success">Confirmată</span>`;
                    actionButton = `<button class="btn btn-sm btn-danger" onclick="cancelBooking(${b.id}, 'doctor')"><i class="bi bi-x-circle"></i> Anulează</button>`;
                }

                let patientInfo = '<em>Sistem</em>';
                if (b.status !== 'BLOCKED' && b.userId) {
                    patientInfo = `ID Pacient: ${b.userId}`;
                    try {
                        const userRes = await fetch(`/auth/user/${b.userId}`);
                        if (userRes.ok) {
                            const userData = await userRes.json();
                            patientInfo = `
                                <strong>${userData.name}</strong><br>
                                <small class="text-muted"><i class="bi bi-telephone"></i> ${userData.phone}</small><br>
                                <button class="btn btn-sm btn-outline-info mt-2 fw-bold" onclick="viewMedicalProfile(${b.userId}, '${userData.name}')">
                                    <i class="bi bi-folder2-open me-1"></i> Vezi Dosar
                                </button>
                            `;
                        }
                    } catch (e) {}
                }

                rowsHtml += `
                    <tr class="${rowClass}">
                        <td class="fw-bold">${formattedDate}</td>
                        <td>${durationMinutes} min</td>
                        <td>${patientInfo}</td>
                        <td>${statusBadge}</td>
                        <td>${actionButton}</td>
                    </tr>
                `;
            }
            tbody.innerHTML = rowsHtml;
        }
    } catch (error) {
        console.error("Eroare încărcare agendă doctor:", error);
    }
}

async function viewMedicalProfile(userId, patientName) {
    const modal = new bootstrap.Modal(document.getElementById('medicalProfileModal'));
    document.getElementById('medicalProfileModalLabel').innerHTML = `<i class="bi bi-file-earmark-medical me-2"></i>Dosar: ${patientName}`;
    const body = document.getElementById('medicalProfileModalBody');
    body.innerHTML = '<div class="text-center py-5"><span class="spinner-border text-info"></span></div>';
    modal.show();

    try {
        const response = await fetch(`/auth/profile/${userId}`);
        if (response.ok) {
            const profile = await response.json();
            body.innerHTML = `
                <ul class="list-group list-group-flush">
                    <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                        <span class="text-muted fw-bold">Grupa Sanguină:</span>
                        <span class="badge bg-danger rounded-pill fs-6">${profile.bloodType || 'N/A'}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                        <span class="text-muted fw-bold">Greutate:</span>
                        <span class="fs-6">${profile.weight ? profile.weight + ' kg' : 'Necompletat'}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                        <span class="text-muted fw-bold">Înălțime:</span>
                        <span class="fs-6">${profile.height ? profile.height + ' cm' : 'Necompletat'}</span>
                    </li>
                    <li class="list-group-item py-3">
                        <span class="text-muted fw-bold d-block mb-1">Alergii declarate:</span>
                        <span>${profile.allergies || 'Nicio alergie declarată.'}</span>
                    </li>
                    <li class="list-group-item py-3">
                        <span class="text-muted fw-bold d-block mb-1">Afecțiuni cronice:</span>
                        <span>${profile.chronicConditions || 'Nicio afecțiune declarată.'}</span>
                    </li>
                </ul>
            `;
        } else {
            body.innerHTML = '<div class="alert alert-warning m-4"><i class="bi bi-exclamation-triangle me-2"></i>Acest pacient nu și-a completat încă dosarul medical.</div>';
        }
    } catch (error) {
        body.innerHTML = '<div class="alert alert-danger m-4"><i class="bi bi-x-circle me-2"></i>Eroare la încărcarea datelor.</div>';
    }
}

async function loadDoctorScheduleSettings() {
    const doctorId = localStorage.getItem('doctorId');
    const matrixBody = document.getElementById('schedule-matrix-body');
    if (!matrixBody || !doctorId) return;

    try {
        const response = await fetch(`/resources/doctors/${doctorId}/schedule`);
        let savedData = [];
        if (response.ok) savedData = await response.json();

        let html = '';
        ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].forEach(day => {
            const config = savedData.find(s => s.dayOfWeek === day) || { startHour: 9, endHour: 17, slotDurationMinutes: 30, isActive: false };

            html += `
                <tr data-day="${day}">
                    <td class="fw-bold text-start ps-3">${DAYS_RO[day]}</td>
                    <td>
                        <div class="form-check form-switch d-inline-block">
                            <input class="form-check-input sched-active" type="checkbox" ${config.isActive ? 'checked' : ''}>
                        </div>
                    </td>
                    <td><input type="number" class="form-control form-control-sm mx-auto sched-start" value="${config.startHour}" min="0" max="23" style="max-width: 70px;"></td>
                    <td><input type="number" class="form-control form-control-sm mx-auto sched-end" value="${config.endHour}" min="0" max="23" style="max-width: 70px;"></td>
                    <td>
                        <select class="form-select form-select-sm mx-auto sched-duration" style="max-width: 100px;">
                            <option value="15" ${config.slotDurationMinutes === 15 ? 'selected' : ''}>15 min</option>
                            <option value="30" ${config.slotDurationMinutes === 30 ? 'selected' : ''}>30 min</option>
                            <option value="45" ${config.slotDurationMinutes === 45 ? 'selected' : ''}>45 min</option>
                            <option value="60" ${config.slotDurationMinutes === 60 ? 'selected' : ''}>60 min</option>
                        </select>
                    </td>
                </tr>`;
        });
        matrixBody.innerHTML = html;
    } catch (e) { console.error("Eroare la încărcarea orarului medicului", e); }
}

document.getElementById('weekly-schedule-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const doctorId = localStorage.getItem('doctorId');
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = 'Se salvează...';

    const payload = [];
    document.querySelectorAll('#schedule-matrix-body tr').forEach(row => {
        payload.push({
            dayOfWeek: row.getAttribute('data-day'),
            isActive: row.querySelector('.sched-active').checked,
            startHour: parseInt(row.querySelector('.sched-start').value),
            endHour: parseInt(row.querySelector('.sched-end').value),
            slotDurationMinutes: parseInt(row.querySelector('.sched-duration').value)
        });
    });

    try {
        const res = await fetch(`/resources/doctors/${doctorId}/schedule/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Programul tău săptămânal a fost salvat!");
            loadDoctorScheduleSettings();
        } else { alert("A apărut o eroare la salvare."); }
    } catch (error) { alert("Eroare de conexiune la server."); }
    finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-save2"></i> Salvează Modificările Programului';
    }
});

document.getElementById('vacation-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const doctorId = localStorage.getItem('doctorId');
    const startDate = document.getElementById('vacation-start').value;
    const endDate = document.getElementById('vacation-end').value;

    if (!startDate || !endDate) return alert("Selectează ambele date!");
    if (new Date(endDate) < new Date(startDate)) return alert("Data de sfârșit trebuie să fie după data de început!");

    const btn = e.target.querySelector('button[type="submit"]');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = 'Se procesează...';
    btn.disabled = true;

    try {
        const response = await fetch(`/bookings/doctor/${doctorId}/block-period`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate, endDate })
        });

        if (response.ok) {
            alert("Zilele libere au fost blocate cu succes!");
            loadDoctorAgenda();
            e.target.reset();
        } else {
            const err = await response.text();
            alert("Eroare la salvare: " + err);
        }
    } catch (error) {
        alert("Eroare de conexiune.");
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
});