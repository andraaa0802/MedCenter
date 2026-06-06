async function loadMedicalProfile() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
        const response = await fetch(`/auth/profile/${userId}`);
        if (response.ok) {
            const profile = await response.json();
            document.getElementById('profile-blood-type').value = profile.bloodType || "";
            document.getElementById('profile-weight').value = profile.weight || "";
            document.getElementById('profile-height').value = profile.height || "";
            document.getElementById('profile-allergies').value = profile.allergies || "";
            document.getElementById('profile-chronic').value = profile.chronicConditions || "";
        }
    } catch (error) {
        console.error("Nu s-a putut încărca dosarul medical.");
    }
}

document.getElementById('medical-profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = 'Se salvează...';

    const payload = {
        bloodType: document.getElementById('profile-blood-type').value,
        weight: document.getElementById('profile-weight').value || null,
        height: document.getElementById('profile-height').value || null,
        allergies: document.getElementById('profile-allergies').value,
        chronicConditions: document.getElementById('profile-chronic').value
    };

    try {
        const response = await fetch(`/auth/profile/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Dosarul medical a fost salvat cu succes!");
        } else {
            alert("A apărut o eroare la salvarea dosarului.");
        }
    } catch (error) {
        alert("Eroare de conexiune la server.");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-save2 me-1"></i> Salvează Dosarul';
    }
});

async function loadMyBookings() {
    const userId = localStorage.getItem('userId');
    const tbody = document.getElementById('user-bookings-table');
    if (!userId || !tbody) return;

    try {
        const response = await fetch(`/bookings/user/${userId}`);
        if (response.ok) {
            const bookings = await response.json();

            if (bookings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Nu ai nicio programare înregistrată.</td></tr>';
                return;
            }

            bookings.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            let rowsHtml = '';

            bookings.forEach(b => {
                if (b.status === 'BLOCKED') return;

                const dateObj = new Date(b.startTime);
                const formattedDate = dateObj.toLocaleDateString('ro-RO') + ' - ' + dateObj.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });

                let statusBadge = '';
                let reviewCol = '<span class="text-muted small">-</span>';

                if (b.status === 'CONFIRMED') {
                    statusBadge = '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Confirmată</span>';
                    reviewCol = `<button class="btn btn-sm btn-outline-danger fw-bold shadow-sm" onclick="cancelBooking(${b.id}, 'patient')"><i class="bi bi-x-circle"></i> Anulează</button>`;
                } else if (b.status === 'COMPLETED') {
                    statusBadge = '<span class="badge bg-primary"><i class="bi bi-check2-all"></i> Finalizată</span>';
                    if (b.isRated) {
                        reviewCol = '<span class="badge bg-success bg-opacity-75"><i class="bi bi-star-fill me-1"></i> Evaluat</span>';
                    } else {
                        reviewCol = `
                            <div id="rating-box-${b.id}" class="text-warning fs-5">
                                <i class="bi bi-star" style="cursor:pointer" onclick="submitRating(${b.doctor.id}, ${b.id}, 1, 'rating-box-${b.id}')"></i>
                                <i class="bi bi-star" style="cursor:pointer" onclick="submitRating(${b.doctor.id}, ${b.id}, 2, 'rating-box-${b.id}')"></i>
                                <i class="bi bi-star" style="cursor:pointer" onclick="submitRating(${b.doctor.id}, ${b.id}, 3, 'rating-box-${b.id}')"></i>
                                <i class="bi bi-star" style="cursor:pointer" onclick="submitRating(${b.doctor.id}, ${b.id}, 4, 'rating-box-${b.id}')"></i>
                                <i class="bi bi-star" style="cursor:pointer" onclick="submitRating(${b.doctor.id}, ${b.id}, 5, 'rating-box-${b.id}')"></i>
                            </div>
                        `;
                    }
                } else if (b.status === 'CANCELLED') {
                    statusBadge = '<span class="badge bg-danger"><i class="bi bi-x-circle"></i> Anulată</span>';
                }

                rowsHtml += `
                    <tr>
                        <td class="fw-bold text-primary">${formattedDate}</td>
                        <td class="fw-bold">${b.doctor.name}</td>
                        <td><span class="badge bg-info text-dark">${b.doctor.specialty.name}</span></td>
                        <td>${statusBadge}</td>
                        <td>${reviewCol}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = rowsHtml;
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Nu s-au putut încărca programările.</td></tr>';
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Eroare de conexiune la server.</td></tr>';
    }
}

async function submitRating(doctorId, bookingId, stars, boxId) {
    try {
        const response = await fetch(`/resources/doctors/${doctorId}/rate?stars=${stars}`, { method: 'PUT' });
        if (response.ok) {
            await fetch(`/bookings/${bookingId}/mark-rated`, { method: 'PUT' });
            const box = document.getElementById(boxId);
            let filledStars = '';
            for(let i = 1; i <= 5; i++) {
                if (i <= stars) {
                    filledStars += '<i class="bi bi-star-fill me-1"></i>';
                } else {
                    filledStars += '<i class="bi bi-star me-1 text-muted opacity-50"></i>';
                }
            }
            box.innerHTML = filledStars + '<br><span class="badge bg-success mt-1">Mulțumim!</span>';
        } else {
            alert("A apărut o eroare la salvarea recenziei.");
        }
    } catch (error) {
        alert("Eroare de conexiune către server.");
    }
}