package com.example.authservice.controller;

import com.example.authservice.dto.LoginRequest;
import com.example.authservice.dto.AuthResponse;
import com.example.authservice.dto.SignupRequest;
import com.example.authservice.model.User;
import com.example.authservice.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostConstruct
    public void initAdmin() {
        if (userRepository.findByEmail("admin@medcenter.ro").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("ParolaAdmin2026"));
            admin.setEmail("admin@medcenter.ro");
            admin.setName("Administrator Sistem");
            admin.setPhone("0000000000");
            admin.setRole("ADMIN");
            admin.setIsActive(true);
            userRepository.save(admin);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());

        if (userOptional.isPresent()) {
            User user = userOptional.get();

            // NOU: Verificăm dacă nu cumva contul i-a fost suspendat!
            if (user.getIsActive() != null && !user.getIsActive()) {
                return new ResponseEntity<>("Contul tău a fost suspendat. Contactează administratorul.", HttpStatus.FORBIDDEN);
            }

            if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                AuthResponse succesResponse = new AuthResponse("token-real", user.getUsername(), user.getEmail(), user.getRole(), user.getId(), user.getDoctorId());
                return new ResponseEntity<>(succesResponse, HttpStatus.OK);
            }
        }
        return new ResponseEntity<>("Email sau parolă incorectă!", HttpStatus.UNAUTHORIZED);
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        String emailRegex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
        if (request.getEmail() == null || !request.getEmail().matches(emailRegex)) {
            return new ResponseEntity<>("Adresa de email nu este validă!", HttpStatus.BAD_REQUEST);
        }

        String phoneRegex = "^[0-9]{10}$";
        if (request.getPhone() == null || !request.getPhone().matches(phoneRegex)) {
            return new ResponseEntity<>("Numărul de telefon trebuie să conțină doar cifre și să aibă între 10 caractere!", HttpStatus.BAD_REQUEST);
        }

        String passwordRegex = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!*?]).{8,}$";
        if (request.getPassword() == null || !request.getPassword().matches(passwordRegex)) {
            return new ResponseEntity<>("Parola nu respectă cerințele minime!", HttpStatus.BAD_REQUEST);
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return new ResponseEntity<>("Email deja utilizat!", HttpStatus.BAD_REQUEST);
        }

        User newUser = new User();
        newUser.setUsername(request.getEmail().split("@")[0]);
        newUser.setEmail(request.getEmail());
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setName(request.getName());
        newUser.setPhone(request.getPhone());
        newUser.setRole("USER");
        newUser.setIsActive(true); // Îl activăm implicit la înregistrare

        userRepository.save(newUser);

        AuthResponse autoLoginResponse = new AuthResponse("token-real", newUser.getUsername(), newUser.getEmail(), newUser.getRole(), newUser.getId(), newUser.getDoctorId());
        return new ResponseEntity<>(autoLoginResponse, HttpStatus.OK);
    }

    // ==============================================================
    // RUTA NOUĂ: ADMINUL CREEAZĂ CONT PENTRU UN DOCTOR NOU
    // ==============================================================
    @PostMapping("/create-doctor-account")
    public ResponseEntity<?> createDoctorAccount(@RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");
        String phone = payload.get("phone");
        String name = payload.get("name");
        Long doctorId = Long.parseLong(payload.get("doctorId"));

        // Verificăm dacă email-ul nu este cumva deja folosit
        if (userRepository.findByEmail(email).isPresent()) {
            return new ResponseEntity<>("Atenție: Profilul public a fost creat, dar Email-ul este deja utilizat de un alt utilizator!", HttpStatus.BAD_REQUEST);
        }

        // Creăm noul utilizator de tip DOCTOR
        User newDoctor = new User();
        newDoctor.setUsername(email.split("@")[0]);
        newDoctor.setEmail(email);
        newDoctor.setPassword(passwordEncoder.encode("Parola123!")); // Parola standard dorită de tine
        newDoctor.setName(name);
        newDoctor.setPhone(phone);
        newDoctor.setRole("DOCTOR"); // Îi dăm direct rolul corect
        newDoctor.setDoctorId(doctorId); // Legăm contul de logare de ID-ul din resource-service
        newDoctor.setIsActive(true);

        userRepository.save(newDoctor);

        return ResponseEntity.ok("Contul de acces pentru medic a fost creat cu succes.");
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<?> getUserDetails(@PathVariable Long id) {
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            java.util.Map<String, String> userInfo = new java.util.HashMap<>();
            userInfo.put("name", user.getName());
            userInfo.put("phone", user.getPhone());
            userInfo.put("email", user.getEmail());
            return ResponseEntity.ok(userInfo);
        }
        return ResponseEntity.notFound().build();
    }

    // ==============================================================
    // RUTE NOI PENTRU SUSPENDAREA ȘI REACTIVAREA CONTULUI DE DOCTOR
    // ==============================================================

    // Suspendare (În loc de ștergere)
    @PutMapping("/doctor/{doctorId}/suspend")
    public ResponseEntity<?> suspendDoctorAccount(@PathVariable Long doctorId) {
        Optional<User> userOpt = userRepository.findByDoctorId(doctorId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setIsActive(false); // Doar îi tăiem accesul
            userRepository.save(user);
            return ResponseEntity.ok("Contul a fost suspendat cu succes.");
        }
        return ResponseEntity.ok("Medicul nu avea cont asociat.");
    }

    // Reactivare
    @PutMapping("/doctor/{doctorId}/reactivate")
    public ResponseEntity<?> reactivateDoctorAccount(@PathVariable Long doctorId) {
        Optional<User> userOpt = userRepository.findByDoctorId(doctorId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setIsActive(true); // Îi redăm accesul
            userRepository.save(user);
            return ResponseEntity.ok("Contul a fost reactivat cu succes.");
        }
        return ResponseEntity.ok("Medicul nu avea cont asociat.");
    }
}