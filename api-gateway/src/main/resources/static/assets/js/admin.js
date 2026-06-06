let adminSpecChart = null;
let adminStatusChart = null;

async function loadAllBookingsForAdmin() {
    try {
        const response = await fetch('/bookings/all');
        if (response.ok) {
            const bookings = await response.json();
            const tbody = document.getElementById('admin-bookings-table');

            let totalValidBookings = 0;
            let completedCount = 0;
            let totalRevenue = 0;
            let specDist = {};
            let statusDist = {};

            if (bookings.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Nu există nicio programare în sistem.</td></tr>`;
                return;
            }

            bookings.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            let rowsHtml = '';

            for (const b of bookings) {
                if (b.status === 'BLOCKED') continue;

                totalValidBookings++;

                if(b.status === 'COMPLETED') {
                    completedCount++;
                    if(b.doctor && b.doctor.consultationPrice) {
                        totalRevenue += b.doctor.consultationPrice;
                    }
                }

                let translatedStatus = b.status === 'COMPLETED' ? 'Finalizată' : (b.status === 'CONFIRMED' ? 'Confirmată' : 'Anulată');
                statusDist[translatedStatus] = (statusDist[translatedStatus] || 0) + 1;

                if (b.doctor && b.doctor.specialty) {
                    let specName = b.doctor.specialty.name || "Nespecificat";
                    specDist[specName] = (specDist[specName] || 0) + 1;
                } else {
                    specDist["Fără specializare"] = (specDist["Fără specializare"] || 0) + 1;
                }

                const dateObj = new Date(b.startTime);
                const formattedDate = dateObj.toLocaleDateString('ro-RO') + ' ' + dateObj.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

                let statusBadge = '', actionButton = '', rowClass = '';

                if (b.status === 'CANCELLED') {
                    statusBadge = `<span class="badge bg-danger">Anulată</span>`;
                    actionButton = `<button class="btn btn-sm btn-outline-secondary" disabled>Anulată</button>`;
                    rowClass = 'table-light text-muted';
                } else if (b.status === 'COMPLETED') {
                    statusBadge = `<span class="badge bg-primary"><i class="bi bi-check2-all"></i> Finalizată</span>`;
                    actionButton = `<button class="btn btn-sm btn-outline-secondary" disabled>Finalizată</button>`;
                    rowClass = 'table-light text-muted';
                } else {
                    statusBadge = `<span class="badge bg-success">Activă</span>`;
                    actionButton = `<button class="btn btn-sm btn-danger" onclick="cancelBooking(${b.id}, 'admin')"><i class="bi bi-x-circle"></i> Anulează</button>`;
                }

                let patientInfo = `ID: ${b.userId}`;
                try {
                    const userRes = await fetch(`/auth/user/${b.userId}`);
                    if (userRes.ok) {
                        const userData = await userRes.json();
                        patientInfo = `
                            <strong>${userData.name}</strong><br>
                            <small class="text-muted"><i class="bi bi-telephone"></i> ${userData.phone}</small><br>
                            <small class="text-muted"><i class="bi bi-envelope"></i> ${userData.email}</small>
                        `;
                    }
                } catch (e) {}

                rowsHtml += `
                    <tr class="${rowClass}">
                        <td class="fw-bold">${formattedDate}</td>
                        <td>${patientInfo}</td>
                        <td>${b.doctor.name} <br><small class="text-muted">${b.doctor.specialty.name}</small></td>
                        <td>${statusBadge}</td>
                        <td>${actionButton}</td>
                    </tr>
                `;
            }

            tbody.innerHTML = rowsHtml;
            document.getElementById('stat-total-bookings').innerText = totalValidBookings;
            document.getElementById('stat-revenue').innerText = totalRevenue;
            document.getElementById('stat-completed').innerText = completedCount;

            renderAdminCharts(specDist, statusDist);
        }
    } catch (error) { console.error("Eroare admin bookings:", error); }
}

function renderAdminCharts(specDist, statusDist) {
    if (adminSpecChart) adminSpecChart.destroy();
    if (adminStatusChart) adminStatusChart.destroy();

    const ctxSpec = document.getElementById('specialtyChart').getContext('2d');
    adminSpecChart = new Chart(ctxSpec, {
        type: 'doughnut',
        data: {
            labels: Object.keys(specDist),
            datasets: [{
                data: Object.values(specDist),
                backgroundColor: ['#0d6efd', '#198754', '#0dcaf0', '#ffc107', '#dc3545', '#6f42c1']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });

    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    adminStatusChart = new Chart(ctxStatus, {
        type: 'bar',
        data: {
            labels: ['Finalizată', 'Confirmată', 'Anulată'],
            datasets: [{
                label: 'Număr Programări',
                data: [
                    statusDist['Finalizată'] || 0,
                    statusDist['Confirmată'] || 0,
                    statusDist['Anulată'] || 0
                ],
                backgroundColor: ['#198754', '#0d6efd', '#dc3545']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
        }
    });
}

// Funcție universală de anulare a programărilor (folosită de Pacient, Doctor și Admin)
async function cancelBooking(bookingId, callerRole) {
    if (confirm("Ești sigur că vrei să anulezi această programare/pauză?")) {
        try {
            const response = await fetch(`/bookings/${bookingId}/cancel`, { method: 'PUT' });
            if (response.ok) {
                alert("Acțiunea a fost efectuată cu succes!");
                if (callerRole === 'admin') loadAllBookingsForAdmin();
                if (callerRole === 'doctor') loadDoctorAgenda();
                if (callerRole === 'patient') loadMyBookings();
            } else {
                alert("A apărut o eroare la anulare.");
            }
        } catch (error) {
            alert("Eroare de conexiune la server.");
        }
    }
}

async function loadAdminMessages() {
    try {
        const response = await fetch('/resources/contact/all');
        if (response.ok) {
            const messages = await response.json();
            const tbody = document.getElementById('admin-messages-table');

            if (messages.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Nu există mesaje.</td></tr>`;
                return;
            }
            messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            let rowsHtml = '';
            messages.forEach(msg => {
                const dateObj = new Date(msg.createdAt);
                const formattedDate = dateObj.toLocaleDateString('ro-RO') + ' ' + dateObj.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
                const isMessageRead = msg.readStatus === true;

                let statusBadge = isMessageRead ? `<span class="badge bg-success"><i class="bi bi-check-circle"></i> Citit</span>` : `<span class="badge bg-warning text-dark"><i class="bi bi-envelope-fill"></i> Necitit</span>`;
                let actionButton = isMessageRead ? `<button class="btn btn-sm btn-outline-secondary" disabled>Vizualizat</button>` : `<button class="btn btn-sm btn-primary" onclick="markMessageAsRead(${msg.id})">Marchează citit</button>`;

                rowsHtml += `
                    <tr class="${isMessageRead ? 'table-light text-muted' : ''}">
                        <td><small>${formattedDate}</small></td>
                        <td><strong>${msg.name}</strong></td>
                        <td><a href="mailto:${msg.email}" class="text-decoration-none ${isMessageRead ? 'text-muted' : ''}">${msg.email}</a></td>
                        <td><span class="badge bg-secondary">${msg.subject}</span></td>
                        <td style="max-width: 250px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${msg.message}">${msg.message}</td>
                        <td>${statusBadge}</td>
                        <td>${actionButton}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = rowsHtml;
        }
    } catch (error) {}
}

async function markMessageAsRead(messageId) {
    try {
        const response = await fetch(`/resources/contact/${messageId}/read`, { method: 'PUT' });
        if (response.ok) loadAdminMessages();
    } catch (error) {}
}