package com.example.bookingservice.controller;

import com.example.bookingservice.model.Booking;
import com.example.bookingservice.model.Doctor;
import com.example.bookingservice.model.Specialty;
import com.example.bookingservice.repository.BookingRepository;
import com.example.bookingservice.repository.DoctorRepository;
import com.example.bookingservice.repository.SpecialtyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/bookings")
@CrossOrigin(origins = "*") // Permite apelurile de pe frontend
public class BookingController {

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private BookingRepository bookingRepository;

    // 1. Ruta pentru specializări (Noul Formular)
    @GetMapping("/specialties")
    public List<Specialty> getAllSpecialties() {
        return specialtyRepository.findAll();
    }

    // 2. Ruta pentru medici filtrați (Noul Formular)
    @GetMapping("/doctors-by-specialty/{specialtyId}")
    public List<Doctor> getDoctorsBySpecialty(@PathVariable Long specialtyId) {
        return doctorRepository.findBySpecialtyId(specialtyId);
    }

    // 3. Ruta de creare programare (Actualizată pentru noul model de date cu start_time/end_time)
    @PostMapping("/create")
    public ResponseEntity<?> createBooking(@RequestBody Map<String, Object> payload) {
        try {
            // VERIFICĂRI DE SIGURANȚĂ (Detectiv)
            if (payload.get("userId") == null) return ResponseEntity.badRequest().body("Eroare la procesare: 'userId' este gol (null)!");
            if (payload.get("doctorId") == null) return ResponseEntity.badRequest().body("Eroare la procesare: 'doctorId' este gol (null)!");
            if (payload.get("startTime") == null) return ResponseEntity.badRequest().body("Eroare la procesare: 'startTime' este gol (null)!");

            Long userId = Long.valueOf(payload.get("userId").toString());
            Long doctorId = Long.valueOf(payload.get("doctorId").toString());
            String startTimeStr = payload.get("startTime").toString(); // Format așteptat: YYYY-MM-DDTHH:mm:ss

            Doctor doctor = doctorRepository.findById(doctorId)
                    .orElseThrow(() -> new RuntimeException("Medicul nu a fost găsit în baza de date!"));

            LocalDateTime startTime = LocalDateTime.parse(startTimeStr);
            LocalDateTime endTime = startTime.plusMinutes(30);

            Booking booking = new Booking();
            booking.setUserId(userId);
            booking.setDoctor(doctor);
            booking.setStartTime(startTime);
            booking.setEndTime(endTime);
            booking.setStatus("CONFIRMED");

            Booking savedBooking = bookingRepository.save(booking);
            return ResponseEntity.ok(savedBooking);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Eroare internă la procesarea programării: " + e.getMessage());
        }
    }

    // 4. Ruta pe care o aveai tu (O PĂSTRĂM pentru istoricul programărilor din contul pacientului)
    @GetMapping("/user/{userId}")
    public List<Booking> getMyBookings(@PathVariable Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    // 5. Ruta pentru ADMIN: Aduce toate programările din sistem
    @GetMapping("/all")
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // 6. Ruta pentru ADMIN: Anulează o programare
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        try {
            Booking booking = bookingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Programarea nu a fost găsită!"));

            booking.setStatus("CANCELLED"); // Schimbăm statusul
            bookingRepository.save(booking);

            /* Aici ar veni integrat un EmailService real.
               Pentru demonstrație, afișăm în consolă simularea trimiterii. */
            System.out.println("=========================================");
            System.out.println("MOCK EMAIL SENDER - SYSTEM NOTIFICATION");
            System.out.println("Către: Pacientul cu ID-ul " + booking.getUserId());
            System.out.println("Subiect: Anulare Programare MedCenter");
            System.out.println("Mesaj: Ne pare rău, programarea dvs. din data de " + booking.getStartTime() + " la medicul " + booking.getDoctor().getName() + " a fost anulată de către clinică.");
            System.out.println("=========================================");

            return ResponseEntity.ok("Programare anulată și pacient notificat!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Eroare: " + e.getMessage());
        }
    }

    // 7. Ruta pentru DOCTOR: Aduce programările lui
    @GetMapping("/doctor/{doctorId}")
    public List<Booking> getDoctorBookings(@PathVariable Long doctorId) {
        return bookingRepository.findByDoctorId(doctorId);
    }

    // 8. Ruta pentru DOCTOR: Creare slot blocat (Pauză)
    @PostMapping("/doctor/{doctorId}/block-slot")
    public ResponseEntity<?> blockSlot(@PathVariable Long doctorId, @RequestBody Map<String, Object> payload) {
        try {
            String startTimeStr = payload.get("startTime").toString();
            Integer durationMinutes = Integer.valueOf(payload.get("durationMinutes").toString());

            Doctor doctor = doctorRepository.findById(doctorId)
                    .orElseThrow(() -> new RuntimeException("Medicul nu a fost găsit!"));

            LocalDateTime startTime = LocalDateTime.parse(startTimeStr);
            LocalDateTime endTime = startTime.plusMinutes(durationMinutes);

            Booking blockedSlot = new Booking();
            blockedSlot.setUserId(0L);
            blockedSlot.setDoctor(doctor);
            blockedSlot.setStartTime(startTime);
            blockedSlot.setEndTime(endTime);
            blockedSlot.setStatus("BLOCKED");

            bookingRepository.save(blockedSlot);
            return ResponseEntity.ok(blockedSlot);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Eroare la blocarea slotului: " + e.getMessage());
        }
    }

    // ==============================================================
    // ADAUGĂ CONCEDIU / ZILE LIBERE (BLOCARE PE INTERVAL)
    // ==============================================================
    @PostMapping("/doctor/{doctorId}/block-period")
    public ResponseEntity<?> blockPeriod(
            @PathVariable Long doctorId,
            @RequestBody java.util.Map<String, String> payload) {
        try {
            java.time.LocalDate startDate = java.time.LocalDate.parse(payload.get("startDate"));
            java.time.LocalDate endDate = java.time.LocalDate.parse(payload.get("endDate"));

            if (endDate.isBefore(startDate)) {
                return ResponseEntity.badRequest().body("Data de sfârșit nu poate fi înaintea datei de început!");
            }

            Doctor doctor = doctorRepository.findById(doctorId)
                    .orElseThrow(() -> new RuntimeException("Doctorul nu a fost găsit!"));

            java.time.LocalDate currentDate = startDate;

            while (!currentDate.isAfter(endDate)) {
                Booking blockedSlot = new Booking();
                blockedSlot.setDoctor(doctor);
                blockedSlot.setUserId(0L);
                blockedSlot.setStatus("BLOCKED");
                blockedSlot.setStartTime(currentDate.atTime(0, 0));
                blockedSlot.setEndTime(currentDate.atTime(23, 59));

                bookingRepository.save(blockedSlot);
                currentDate = currentDate.plusDays(1);
            }

            return ResponseEntity.ok("Perioada a fost blocată cu succes!");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Eroare la procesarea blocării: " + e.getMessage());
        }
    }

    // ==============================================================
    // GENERATOR DINAMIC DE SLOTURI PENTRU PACIENȚI (REPARAT PENTRU CONCEDII)
    // ==============================================================
    @GetMapping("/available-slots")
    public ResponseEntity<java.util.List<String>> getAvailableSlots(
            @RequestParam Long doctorId,
            @RequestParam String date) {
        try {
            java.time.LocalDate localDate = java.time.LocalDate.parse(date);
            String dayOfWeek = localDate.getDayOfWeek().toString();

            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            String resourceUrl = "http://localhost:8082/resources/doctors/" + doctorId + "/schedule";

            org.springframework.http.ResponseEntity<java.util.List> response =
                    restTemplate.getForEntity(resourceUrl, java.util.List.class);

            java.util.List<java.util.Map<String, Object>> schedules = response.getBody();
            java.util.Map<String, Object> todaySchedule = null;

            if (schedules != null) {
                for (java.util.Map<String, Object> sched : schedules) {
                    if (dayOfWeek.equals(sched.get("dayOfWeek")) && Boolean.TRUE.equals(sched.get("isActive"))) {
                        todaySchedule = sched;
                        break;
                    }
                }
            }

            if (todaySchedule == null) {
                return ResponseEntity.ok(java.util.Collections.emptyList());
            }

            int startHour = (Integer) todaySchedule.get("startHour");
            int endHour = (Integer) todaySchedule.get("endHour");
            int duration = (Integer) todaySchedule.get("slotDurationMinutes");

            java.util.List<String> availableSlots = new java.util.ArrayList<>();
            java.time.LocalTime currentTime = java.time.LocalTime.of(startHour, 0);
            java.time.LocalTime endTime = java.time.LocalTime.of(endHour, 0);
            java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm");

            while (currentTime.isBefore(endTime)) {
                availableSlots.add(currentTime.format(formatter));
                currentTime = currentTime.plusMinutes(duration);
            }

            java.util.List<Booking> existingBookings = bookingRepository.findAll().stream()
                    .filter(b -> b.getDoctor().getId().equals(doctorId) &&
                            b.getStartTime().toLocalDate().equals(localDate) &&
                            !"CANCELLED".equals(b.getStatus()))
                    .toList();

            // VERIFICARE CONCEDIU: Caută un blocaj care începe exact la ora 00:00
            boolean isVacation = existingBookings.stream()
                    .anyMatch(b -> "BLOCKED".equals(b.getStatus()) &&
                            b.getStartTime().toLocalTime().equals(java.time.LocalTime.of(0, 0)));

            // Dacă este în concediu, întoarce o listă goală (nimic disponibil pe ecran)
            if (isVacation) {
                return ResponseEntity.ok(java.util.Collections.emptyList());
            }

            // Dacă NU e concediu, elimină doar orele deja ocupate de alți pacienți
            for (Booking b : existingBookings) {
                String bookedTime = b.getStartTime().toLocalTime().format(formatter);
                availableSlots.remove(bookedTime);
            }

            return ResponseEntity.ok(availableSlots);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
    // ==============================================================
    // ANULARE AUTOMATĂ LA ȘTERGEREA LOGICĂ A UNUI MEDIC
    // ==============================================================
    @org.springframework.transaction.annotation.Transactional
    @PutMapping("/doctor/{doctorId}/cancel-all")
    public ResponseEntity<?> cancelAllDoctorBookings(@PathVariable Long doctorId) {
        try {
            List<Booking> doctorBookings = bookingRepository.findByDoctorId(doctorId);
            java.time.LocalDateTime now = java.time.LocalDateTime.now(); // Luăm data și ora curentă

            for (Booking b : doctorBookings) {
                // Verificăm dacă programarea este confirmată ȘI dacă data ei este în viitor!
                if ("CONFIRMED".equals(b.getStatus()) && b.getStartTime().isAfter(now)) {
                    b.setStatus("CANCELLED");
                }
            }

            bookingRepository.saveAll(doctorBookings);
            return ResponseEntity.ok("Programările viitoare au fost anulate. Istoricul din trecut a rămas intact.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Eroare la anularea automată a programărilor: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/mark-rated")
    public ResponseEntity<?> markAsRated(@PathVariable Long id) {
        Optional<Booking> bookingOpt = bookingRepository.findById(id);
        if (bookingOpt.isPresent()) {
            Booking booking = bookingOpt.get();
            booking.setIsRated(true);
            bookingRepository.save(booking);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}