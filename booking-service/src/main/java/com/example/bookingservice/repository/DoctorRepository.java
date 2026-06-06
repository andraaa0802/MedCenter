package com.example.bookingservice.repository;

import com.example.bookingservice.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    // Spring Boot știe să caute după ID-ul specializării din interiorul obiectului Specialty
    List<Doctor> findBySpecialtyId(Long specialtyId);
}