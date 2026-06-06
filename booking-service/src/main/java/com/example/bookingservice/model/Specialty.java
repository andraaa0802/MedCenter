package com.example.bookingservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "specialties", catalog="resource_db")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Specialty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;
}