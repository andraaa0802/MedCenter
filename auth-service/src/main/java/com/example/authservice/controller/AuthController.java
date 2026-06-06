package com.example.authservice.controller;

import com.example.authservice.dto.*;
import com.example.authservice.model.User;
import com.example.authservice.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
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
        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                    if (Boolean.FALSE.equals(user.getIsActive())) {
                        return new ResponseEntity<>("Cont suspendat.", HttpStatus.FORBIDDEN);
                    }
                    if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                        AuthResponse response = new AuthResponse("token-real", user.getUsername(), user.getEmail(), user.getRole(), user.getId(), user.getDoctorId());
                        return ResponseEntity.ok(response);
                    }
                    return new ResponseEntity<>("Date incorecte!", HttpStatus.UNAUTHORIZED);
                })
                .orElse(new ResponseEntity<>("Date incorecte!", HttpStatus.UNAUTHORIZED));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        if (!request.getEmail().matches("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$") ||
                !request.getPhone().matches("^[0-9]{10}$") ||
                !request.getPassword().matches("^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!*?]).{8,}$")) {
            return ResponseEntity.badRequest().body("Date invalide.");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Email utilizat.");
        }

        User user = new User();
        user.setUsername(request.getEmail().split("@")[0]);
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getName());
        user.setPhone(request.getPhone());
        user.setRole("USER");
        user.setIsActive(true);
        userRepository.save(user);

        return ResponseEntity.ok(new AuthResponse("token-real", user.getUsername(), user.getEmail(), user.getRole(), user.getId(), user.getDoctorId()));
    }

    @PostMapping("/create-doctor-account")
    public ResponseEntity<?> createDoctorAccount(@RequestBody Map<String, String> payload) {
        if (userRepository.findByEmail(payload.get("email")).isPresent()) {
            return ResponseEntity.badRequest().body("Email existent.");
        }

        User doctor = new User();
        doctor.setUsername(payload.get("email").split("@")[0]);
        doctor.setEmail(payload.get("email"));
        doctor.setPassword(passwordEncoder.encode("Parola123!"));
        doctor.setName(payload.get("name"));
        doctor.setPhone(payload.get("phone"));
        doctor.setRole("DOCTOR");
        doctor.setDoctorId(Long.parseLong(payload.get("doctorId")));
        doctor.setIsActive(true);
        userRepository.save(doctor);

        return ResponseEntity.ok("Cont creat.");
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<?> getUserDetails(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            Map<String, String> info = new HashMap<>();
            info.put("name", user.getName());
            info.put("phone", user.getPhone());
            info.put("email", user.getEmail());
            return ResponseEntity.ok(info);
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/doctor/{doctorId}/suspend")
    public ResponseEntity<?> suspendDoctorAccount(@PathVariable Long doctorId) {
        userRepository.findByDoctorId(doctorId).ifPresent(user -> {
            user.setIsActive(false);
            userRepository.save(user);
        });
        return ResponseEntity.ok("Acțiune finalizată.");
    }

    @PutMapping("/doctor/{doctorId}/reactivate")
    public ResponseEntity<?> reactivateDoctorAccount(@PathVariable Long doctorId) {
        userRepository.findByDoctorId(doctorId).ifPresent(user -> {
            user.setIsActive(true);
            userRepository.save(user);
        });
        return ResponseEntity.ok("Acțiune finalizată.");
    }
}