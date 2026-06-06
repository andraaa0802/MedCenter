package com.example.resourceservice.controller;

import com.example.resourceservice.model.Doctor;
import com.example.resourceservice.model.DoctorSchedule;
import com.example.resourceservice.model.Specialty;
import com.example.resourceservice.repository.DoctorRepository;
import com.example.resourceservice.repository.DoctorScheduleRepository;
import com.example.resourceservice.repository.SpecialtyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/resources/doctors")
public class DoctorController {

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @Autowired
    private DoctorScheduleRepository doctorScheduleRepository;

    @Autowired
    private RestTemplate restTemplate;

    @GetMapping("/all")
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String uploadDir = System.getProperty("user.dir") + "/uploads/";
            File dir = new File(uploadDir);
            if (!dir.exists()) dir.mkdirs();

            String uniqueFileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(uploadDir + uniqueFileName);
            Files.write(filePath, file.getBytes());

            return ResponseEntity.ok("http://localhost:8082/uploads/" + uniqueFileName);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Eroare la încărcarea imaginii: " + e.getMessage());
        }
    }

    @PostMapping("/add")
    public ResponseEntity<?> addDoctor(@RequestBody DoctorSaveRequest request) {
        try {
            Specialty specialty = specialtyRepository.findById(request.getSpecialtyId())
                    .orElseThrow(() -> new RuntimeException("Specializarea nu a fost găsită!"));

            Doctor newDoctor = new Doctor();
            newDoctor.setName(request.getName());
            newDoctor.setSpecialty(specialty);
            newDoctor.setConsultationPrice(request.getConsultationPrice());
            newDoctor.setImageUrl(request.getImageName());
            newDoctor.setIsActive(true);

            return ResponseEntity.ok(doctorRepository.save(newDoctor));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Eroare la salvare: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDoctor(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Doctor doctor = doctorRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Medicul nu a fost găsit!"));

            if (payload.containsKey("name")) doctor.setName(payload.get("name").toString());
            if (payload.containsKey("consultationPrice")) doctor.setConsultationPrice(Double.valueOf(payload.get("consultationPrice").toString()));
            if (payload.containsKey("imageUrl")) doctor.setImageUrl(payload.get("imageUrl").toString());

            return ResponseEntity.ok(doctorRepository.save(doctor));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Eroare la actualizare: " + e.getMessage());
        }
    }

    @GetMapping("/{doctorId}/schedule")
    public ResponseEntity<List<DoctorSchedule>> getDoctorSchedule(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorScheduleRepository.findByDoctorId(doctorId));
    }

    @PostMapping("/{doctorId}/schedule/save")
    public ResponseEntity<?> saveDoctorSchedule(@PathVariable Long doctorId, @RequestBody List<DoctorSchedule> schedules) {
        try {
            for (DoctorSchedule sched : schedules) {
                DoctorSchedule toSave = doctorScheduleRepository.findByDoctorIdAndDayOfWeek(doctorId, sched.getDayOfWeek())
                        .orElse(new DoctorSchedule());

                toSave.setDoctorId(doctorId);
                toSave.setDayOfWeek(sched.getDayOfWeek());
                toSave.setStartHour(sched.getStartHour());
                toSave.setEndHour(sched.getEndHour());
                toSave.setSlotDurationMinutes(sched.getSlotDurationMinutes());
                toSave.setIsActive(sched.getIsActive());
                doctorScheduleRepository.save(toSave);
            }
            return ResponseEntity.ok("Programul a fost actualizat.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Eroare la salvarea orarului: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDoctor(@PathVariable Long id) {
        try {
            Doctor doctor = doctorRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Medicul nu a fost găsit."));

            doctor.setIsActive(false);
            doctorRepository.save(doctor);

            try {
                restTemplate.put("http://127.0.0.1:8083/bookings/doctor/" + id + "/cancel-all", null);
                restTemplate.put("http://127.0.0.1:8081/auth/doctor/" + id + "/suspend", null);
            } catch (Exception e) {
                System.err.println("Eroare microservicii: " + e.getMessage());
            }

            return ResponseEntity.ok("Medicul a fost suspendat.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Eroare: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/reactivate")
    public ResponseEntity<?> reactivateDoctor(@PathVariable Long id) {
        try {
            Doctor doctor = doctorRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Medicul nu a fost găsit."));

            doctor.setIsActive(true);
            doctorRepository.save(doctor);
            restTemplate.put("http://127.0.0.1:8081/auth/doctor/" + id + "/reactivate", null);

            return ResponseEntity.ok("Medicul a fost reactivat.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Eroare: " + e.getMessage());
        }
    }

    @PutMapping("/{id}/rate")
    public ResponseEntity<?> rateDoctor(@PathVariable Long id, @RequestParam Integer stars) {
        if (stars < 1 || stars > 5) return ResponseEntity.badRequest().body("Rating între 1-5.");

        return doctorRepository.findById(id).map(doctor -> {
            double newRating = ((doctor.getRating() * doctor.getReviewCount()) + stars) / (doctor.getReviewCount() + 1);
            doctor.setReviewCount(doctor.getReviewCount() + 1);
            doctor.setRating(Math.round(newRating * 10.0) / 10.0);
            doctorRepository.save(doctor);
            return ResponseEntity.ok("Rating actualizat: " + doctor.getRating());
        }).orElse(ResponseEntity.notFound().build());
    }
}