package com.example.resourceservice.controller;

import com.example.resourceservice.model.Specialty;
import com.example.resourceservice.repository.SpecialtyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/resources/specialties")
public class SpecialtyController {

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @GetMapping("/all")
    public List<Specialty> getAllSpecialties() {
        return specialtyRepository.findAll();
    }

    @PostMapping("/add")
    public ResponseEntity<Specialty> addSpecialty(@RequestBody Specialty specialty) {
        Specialty saved = specialtyRepository.save(specialty);
        return ResponseEntity.ok(saved);
    }
}