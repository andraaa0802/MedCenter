package com.example.authservice.controller;

import com.example.authservice.model.MedicalProfile;
import com.example.authservice.repository.MedicalProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/auth/profile")
public class MedicalProfileController {

    @Autowired
    private MedicalProfileRepository profileRepository;

    // Citim fișa medicală a unui pacient
    @GetMapping("/{userId}")
    public ResponseEntity<MedicalProfile> getProfile(@PathVariable Long userId) {
        return profileRepository.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Creăm sau actualizăm fișa medicală
    @PostMapping("/{userId}")
    public ResponseEntity<MedicalProfile> saveProfile(@PathVariable Long userId, @RequestBody MedicalProfile profileData) {
        Optional<MedicalProfile> existingProfile = profileRepository.findByUserId(userId);
        MedicalProfile profileToSave;

        if (existingProfile.isPresent()) {
            // Dacă există deja, îl actualizăm (Update)
            profileToSave = existingProfile.get();
            profileToSave.setBloodType(profileData.getBloodType());
            profileToSave.setWeight(profileData.getWeight());
            profileToSave.setHeight(profileData.getHeight());
            profileToSave.setAllergies(profileData.getAllergies());
            profileToSave.setChronicConditions(profileData.getChronicConditions());
        } else {
            // Dacă nu există, creăm unul nou (Create)
            profileToSave = profileData;
            profileToSave.setUserId(userId);
        }

        MedicalProfile savedProfile = profileRepository.save(profileToSave);
        return ResponseEntity.ok(savedProfile);
    }
}