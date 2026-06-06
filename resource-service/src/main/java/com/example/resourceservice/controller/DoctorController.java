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
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
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

    @GetMapping("/all")
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String uploadDir = "/Users/andra/Desktop/Clinica_Uploads/";
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String uniqueFileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(uploadDir + uniqueFileName);

            Files.write(filePath, file.getBytes());

            String fileDownloadUri = "http://localhost:8082/uploads/" + uniqueFileName;
            return ResponseEntity.ok(fileDownloadUri);

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
            newDoctor.setIsActive(true); // Asigurăm că e activ din start

            Doctor savedDoctor = doctorRepository.save(newDoctor);
            return ResponseEntity.ok(savedDoctor);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Eroare la salvarea medicului: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDoctor(@PathVariable Long id, @RequestBody java.util.Map<String, Object> payload) {
        try {
            Doctor doctor = doctorRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Medicul nu a fost găsit!"));

            if (payload.containsKey("name")) {
                doctor.setName(payload.get("name").toString());
            }
            if (payload.containsKey("consultationPrice")) {
                doctor.setConsultationPrice(Double.valueOf(payload.get("consultationPrice").toString()));
            }
            if (payload.containsKey("imageUrl")) {
                doctor.setImageUrl(payload.get("imageUrl").toString());
            }

            Doctor updatedDoctor = doctorRepository.save(doctor);
            return ResponseEntity.ok(updatedDoctor);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Eroare la actualizarea medicului: " + e.getMessage());
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
                Optional<DoctorSchedule> existing = doctorScheduleRepository
                        .findByDoctorIdAndDayOfWeek(doctorId, sched.getDayOfWeek());

                DoctorSchedule toSave = existing.orElse(new DoctorSchedule());
                toSave.setDoctorId(doctorId);
                toSave.setDayOfWeek(sched.getDayOfWeek());
                toSave.setStartHour(sched.getStartHour());
                toSave.setEndHour(sched.getEndHour());
                toSave.setSlotDurationMinutes(sched.getSlotDurationMinutes());
                toSave.setIsActive(sched.getIsActive());

                doctorScheduleRepository.save(toSave);
            }
            return ResponseEntity.ok("Programul de lucru a fost actualizat!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Eroare la salvarea orarului: " + e.getMessage());
        }
    }

    // ==============================================================
    // SUSPENDARE MEDIC (Soft Delete + Anulare programări + Tăiere acces login)
    // ==============================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDoctor(@PathVariable Long id) {
        try {
            Doctor doctor = doctorRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Medicul nu a fost găsit în sistem."));

            doctor.setIsActive(false); // Inactivare din lista publică
            doctorRepository.save(doctor);

            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

            try {
                // Anulăm agendele din viitor
                String bookingServiceUrl = "http://127.0.0.1:8083/bookings/doctor/" + id + "/cancel-all";
                restTemplate.put(bookingServiceUrl, null);
            } catch (Exception e) {
                System.err.println("EROARE Booking Service: " + e.getMessage());
            }

            try {
                // MODIFICARE AICI: Facem PUT către ruta de /suspend
                String authServiceUrl = "http://127.0.0.1:8081/auth/doctor/" + id + "/suspend";
                restTemplate.put(authServiceUrl, null);
            } catch (Exception e) {
                System.err.println("EROARE Auth Service: " + e.getMessage());
            }

            return ResponseEntity.ok("Medicul a fost suspendat cu succes!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Eroare la suspendare: " + e.getMessage());
        }
    }

    // ==============================================================
    // REACTIVARE MEDIC (Reactivare în lista publică + Permitere login)
    // ==============================================================
    @PutMapping("/{id}/reactivate")
    public ResponseEntity<?> reactivateDoctor(@PathVariable Long id) {
        try {
            Doctor doctor = doctorRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Medicul nu a fost găsit în sistem."));

            doctor.setIsActive(true); // Îl facem vizibil pentru programări noi
            doctorRepository.save(doctor);

            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

            try {
                // Îi redăm accesul la panoul de control
                String authServiceUrl = "http://127.0.0.1:8081/auth/doctor/" + id + "/reactivate";
                restTemplate.put(authServiceUrl, null);
            } catch (Exception e) {
                System.err.println("EROARE Auth Service: " + e.getMessage());
            }

            return ResponseEntity.ok("Medicul a fost reactivat cu succes!");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Eroare la reactivare: " + e.getMessage());
        }
    }

    // Endpoint pentru adăugarea unei noi recenzii (steluțe)
    @PutMapping("/{id}/rate")
    public ResponseEntity<?> rateDoctor(@PathVariable Long id, @RequestParam Integer stars) {
        if (stars < 1 || stars > 5) {
            return ResponseEntity.badRequest().body("Rating-ul trebuie să fie între 1 și 5 stele.");
        }

        Optional<Doctor> optionalDoctor = doctorRepository.findById(id);
        if (optionalDoctor.isPresent()) {
            Doctor doctor = optionalDoctor.get();

            int currentCount = doctor.getReviewCount();
            double currentRating = doctor.getRating();

            // Calculăm noua medie
            double newRating = ((currentRating * currentCount) + stars) / (currentCount + 1);

            // Actualizăm datele
            doctor.setReviewCount(currentCount + 1);
            // Rotunjim matematic la o singură zecimală (ex: 4.333 devine 4.3)
            doctor.setRating(Math.round(newRating * 10.0) / 10.0);

            doctorRepository.save(doctor);
            return ResponseEntity.ok("Rating actualizat cu succes la: " + doctor.getRating());
        }

        return ResponseEntity.notFound().build();
    }
}

class DoctorSaveRequest {
    private String name;
    private Long specialtyId;
    private Double consultationPrice;
    private Integer experienceYears;
    private String imageName;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getSpecialtyId() { return specialtyId; }
    public void setSpecialtyId(Long specialtyId) { this.specialtyId = specialtyId; }
    public Double getConsultationPrice() { return consultationPrice; }
    public void setConsultationPrice(Double consultationPrice) { this.consultationPrice = consultationPrice; }
    public String getImageName() { return imageName; }
    public void setImageName(String imageName) { this.imageName = imageName; }
}