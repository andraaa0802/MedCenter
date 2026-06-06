package com.example.bookingservice.controller;

import com.example.bookingservice.model.*;
import com.example.bookingservice.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/bookings")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class BookingController {

    private final SpecialtyRepository specialtyRepository;
    private final DoctorRepository doctorRepository;
    private final BookingRepository bookingRepository;
    private final RestTemplate restTemplate;

    @GetMapping("/specialties")
    public List<Specialty> getAllSpecialties() {
        return specialtyRepository.findAll();
    }

    @GetMapping("/doctors-by-specialty/{specialtyId}")
    public List<Doctor> getDoctorsBySpecialty(@PathVariable Long specialtyId) {
        return doctorRepository.findBySpecialtyId(specialtyId);
    }

    @PostMapping("/create")
    public ResponseEntity<?> createBooking(@RequestBody Map<String, Object> payload) {
        try {
            Long userId = Long.valueOf(payload.get("userId").toString());
            Long doctorId = Long.valueOf(payload.get("doctorId").toString());
            LocalDateTime startTime = LocalDateTime.parse(payload.get("startTime").toString());

            Doctor doctor = doctorRepository.findById(doctorId)
                    .orElseThrow(() -> new RuntimeException("Medicul nu a fost găsit!"));

            Booking booking = new Booking();
            booking.setUserId(userId);
            booking.setDoctor(doctor);
            booking.setStartTime(startTime);
            booking.setEndTime(startTime.plusMinutes(30));
            booking.setStatus("CONFIRMED");

            return ResponseEntity.ok(bookingRepository.save(booking));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Eroare: " + e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public List<Booking> getMyBookings(@PathVariable Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    @GetMapping("/all")
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        try {
            Booking booking = bookingRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Programarea nu a fost găsită!"));
            booking.setStatus("CANCELLED");
            bookingRepository.save(booking);
            return ResponseEntity.ok("Programare anulată.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Eroare: " + e.getMessage());
        }
    }

    @GetMapping("/doctor/{doctorId}")
    public List<Booking> getDoctorBookings(@PathVariable Long doctorId) {
        return bookingRepository.findByDoctorId(doctorId);
    }

    @PostMapping("/doctor/{doctorId}/block-slot")
    public ResponseEntity<?> blockSlot(@PathVariable Long doctorId, @RequestBody Map<String, Object> payload) {
        try {
            LocalDateTime startTime = LocalDateTime.parse(payload.get("startTime").toString());
            Integer duration = Integer.valueOf(payload.get("durationMinutes").toString());

            Doctor doctor = doctorRepository.findById(doctorId)
                    .orElseThrow(() -> new RuntimeException("Medicul nu a fost găsit!"));

            Booking blocked = new Booking();
            blocked.setUserId(0L);
            blocked.setDoctor(doctor);
            blocked.setStartTime(startTime);
            blocked.setEndTime(startTime.plusMinutes(duration));
            blocked.setStatus("BLOCKED");

            return ResponseEntity.ok(bookingRepository.save(blocked));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Eroare: " + e.getMessage());
        }
    }

    @PostMapping("/doctor/{doctorId}/block-period")
    public ResponseEntity<?> blockPeriod(@PathVariable Long doctorId, @RequestBody Map<String, String> payload) {
        try {
            LocalDate startDate = LocalDate.parse(payload.get("startDate"));
            LocalDate endDate = LocalDate.parse(payload.get("endDate"));

            Doctor doctor = doctorRepository.findById(doctorId)
                    .orElseThrow(() -> new RuntimeException("Medicul nu a fost găsit!"));

            LocalDate current = startDate;
            while (!current.isAfter(endDate)) {
                Booking blocked = new Booking();
                blocked.setDoctor(doctor);
                blocked.setUserId(0L);
                blocked.setStatus("BLOCKED");
                blocked.setStartTime(current.atTime(0, 0));
                blocked.setEndTime(current.atTime(23, 59));
                bookingRepository.save(blocked);
                current = current.plusDays(1);
            }
            return ResponseEntity.ok("Perioada blocată.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Eroare: " + e.getMessage());
        }
    }

    @GetMapping("/available-slots")
    public ResponseEntity<List<String>> getAvailableSlots(@RequestParam Long doctorId, @RequestParam String date) {
        try {
            LocalDate localDate = LocalDate.parse(date);
            String dayOfWeek = localDate.getDayOfWeek().toString();

            String url = "http://localhost:8082/resources/doctors/" + doctorId + "/schedule";
            List<Map<String, Object>> schedules = restTemplate.getForObject(url, List.class);

            Map<String, Object> today = schedules.stream()
                    .filter(s -> dayOfWeek.equals(s.get("dayOfWeek")) && Boolean.TRUE.equals(s.get("isActive")))
                    .findFirst().orElse(null);

            if (today == null) return ResponseEntity.ok(Collections.emptyList());

            int startHour = (Integer) today.get("startHour");
            int endHour = (Integer) today.get("endHour");
            int duration = (Integer) today.get("slotDurationMinutes");

            List<String> available = new ArrayList<>();
            LocalTime time = LocalTime.of(startHour, 0);
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("HH:mm");

            while (time.isBefore(LocalTime.of(endHour, 0))) {
                available.add(time.format(formatter));
                time = time.plusMinutes(duration);
            }

            List<Booking> bookings = bookingRepository.findAll().stream()
                    .filter(b -> b.getDoctor().getId().equals(doctorId) &&
                            b.getStartTime().toLocalDate().equals(localDate) &&
                            !"CANCELLED".equals(b.getStatus()))
                    .collect(Collectors.toList());

            if (bookings.stream().anyMatch(b -> "BLOCKED".equals(b.getStatus()) && b.getStartTime().getHour() == 0)) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            bookings.forEach(b -> available.remove(b.getStartTime().toLocalTime().format(formatter)));
            return ResponseEntity.ok(available);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @org.springframework.transaction.annotation.Transactional
    @PutMapping("/doctor/{doctorId}/cancel-all")
    public ResponseEntity<?> cancelAllDoctorBookings(@PathVariable Long doctorId) {
        List<Booking> bookings = bookingRepository.findByDoctorId(doctorId).stream()
                .filter(b -> "CONFIRMED".equals(b.getStatus()) && b.getStartTime().isAfter(LocalDateTime.now()))
                .peek(b -> b.setStatus("CANCELLED"))
                .collect(Collectors.toList());
        bookingRepository.saveAll(bookings);
        return ResponseEntity.ok("Programări anulate.");
    }

    @PutMapping("/{id}/mark-rated")
    public ResponseEntity<?> markAsRated(@PathVariable Long id) {
        return bookingRepository.findById(id).map(b -> {
            b.setIsRated(true);
            bookingRepository.save(b);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}