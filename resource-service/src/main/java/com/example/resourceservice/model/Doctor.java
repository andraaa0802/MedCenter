package com.example.resourceservice.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "doctors")
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

    @ManyToOne
    @JoinColumn(name = "specialty_id", nullable = false)
    private Specialty specialty;

    @Column(nullable = false)
    private Double consultationPrice;

    private String imageUrl;

    @Column(name = "start_hour", columnDefinition = "integer default 9")
    private Integer startHour = 9;

    @Column(name = "end_hour", columnDefinition = "integer default 17")
    private Integer endHour = 17;

    @Column(name = "slot_duration_minutes", columnDefinition = "integer default 30")
    private Integer slotDurationMinutes = 30;

    @Column(columnDefinition = "boolean default true")
    private Boolean isActive = true;

    @Column(name = "rating", columnDefinition = "Double default 0.0")
    private Double rating = 0.0;

    @Column(name = "review_count", columnDefinition = "Integer default 0")
    private Integer reviewCount = 0;
}