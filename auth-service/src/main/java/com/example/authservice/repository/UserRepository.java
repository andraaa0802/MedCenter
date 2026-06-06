package com.example.authservice.repository;

import com.example.authservice.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Pentru logare (existență pacient/doctor)
    Optional<User> findByEmail(String email);

    // NOU: Pentru ștergerea contului de acces când medicul este concediat
    Optional<User> findByDoctorId(Long doctorId);
}