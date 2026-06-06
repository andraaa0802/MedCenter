package com.example.authservice.repository;

import com.example.authservice.model.MedicalProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MedicalProfileRepository extends JpaRepository<MedicalProfile, Long> {
    Optional<MedicalProfile> findByUserId(Long userId);
}