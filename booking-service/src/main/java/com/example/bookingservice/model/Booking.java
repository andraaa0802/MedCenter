package com.example.bookingservice.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Aici salvăm ID-ul pacientului din auth-service
    @Column(name = "user_id", nullable = false)
    private Long userId;

    // Legătura cu tabelul medicului (prin coloana resource_id)
    @ManyToOne
    @JoinColumn(name = "resource_id", nullable = false)
    private Doctor doctor;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(nullable = false)
    private String status = "CONFIRMED";

    @Column(name = "is_rated", columnDefinition = "boolean default false")
    private Boolean isRated = false;

    public Boolean getIsRated() {
        return isRated;
    }

    public void setIsRated(Boolean rated) {
        isRated = rated;
    }

    public Booking() {}

    // Getters și Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}