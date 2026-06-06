package com.example.bookingservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "doctors", catalog="resource_db")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "consultation_price")
    private Double consultationPrice;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(columnDefinition = "boolean default true")
    private Boolean isActive = true;

    @ManyToOne
    @JoinColumn(name = "specialty_id", nullable = false)
    private Specialty specialty;

    @Column(name = "rating", columnDefinition = "Double default 0.0")
    private Double rating = 0.0;

    @Column(name = "review_count", columnDefinition = "Integer default 0")
    private Integer reviewCount = 0;
}