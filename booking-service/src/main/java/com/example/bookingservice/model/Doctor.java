package com.example.bookingservice.model;

import jakarta.persistence.*;

@Entity
@Table(name = "doctors", catalog="resource_db")
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
    private Boolean isActive = true; // ADĂUGAT PENTRU SINCRONIZARE

    @ManyToOne
    @JoinColumn(name = "specialty_id", nullable = false)
    private Specialty specialty;

    // --- CÂMPURI NOI PENTRU RECENZII ---
    @Column(name = "rating", columnDefinition = "Double default 0.0")
    private Double rating = 0.0;

    @Column(name = "review_count", columnDefinition = "Integer default 0")
    private Integer reviewCount = 0;

    public Doctor() {}

    // Getters și Setters clasici
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getConsultationPrice() { return consultationPrice; }
    public void setConsultationPrice(Double consultationPrice) { this.consultationPrice = consultationPrice; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Specialty getSpecialty() { return specialty; }
    public void setSpecialty(Specialty specialty) { this.specialty = specialty; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { this.isActive = active; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public Integer getReviewCount() { return reviewCount; }
    public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }
}