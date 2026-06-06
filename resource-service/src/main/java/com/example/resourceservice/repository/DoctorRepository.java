package com.example.resourceservice.repository;

import com.example.resourceservice.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    // Aici vom putea adăuga ulterior metode automate de filtrare dacă e nevoie,
    // deși sortarea și filtrarea inițială o putem face foarte elegant direct în Frontend (JavaScript)
    // pentru o viteză maximă și zero latență la click!
}