package com.example.resourceservice.repository;

import com.example.resourceservice.model.ContactMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {
    // Ne oferă automat metodele save(), findAll(), deleteById() etc.
}