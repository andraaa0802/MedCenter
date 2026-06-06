package com.example.authservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    private String name;

    private String phone;

    private String role;

    @Column(name = "doctor_id", nullable = true)
    private Long doctorId;

    // NOU: Câmpul pentru suspendarea conturilor (implicit true la creare)
    @Column(name = "is_active", columnDefinition = "boolean default true")
    private Boolean isActive = true;
}