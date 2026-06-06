package com.example.authservice.controller;

import com.example.authservice.model.MedicalProfile;
import com.example.authservice.repository.MedicalProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth/profile")
@RequiredArgsConstructor
public class MedicalProfileController {

    private final MedicalProfileRepository profileRepository;

    @GetMapping("/{userId}")
    public ResponseEntity<MedicalProfile> getProfile(@PathVariable Long userId) {
        return profileRepository.findByUserId(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{userId}")
    public ResponseEntity<MedicalProfile> saveProfile(@PathVariable Long userId, @RequestBody MedicalProfile profileData) {
        MedicalProfile profileToSave = profileRepository.findByUserId(userId)
                .orElse(new MedicalProfile());

        profileToSave.setUserId(userId);
        profileToSave.setBloodType(profileData.getBloodType());
        profileToSave.setWeight(profileData.getWeight());
        profileToSave.setHeight(profileData.getHeight());
        profileToSave.setAllergies(profileData.getAllergies());
        profileToSave.setChronicConditions(profileData.getChronicConditions());

        return ResponseEntity.ok(profileRepository.save(profileToSave));
    }
}