package com.example.bookingservice.repository;

import com.example.bookingservice.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByDoctorId(Long doctorId);
    List<Booking> findByUserId(Long userId);

    // NOU: Metodă magică ce caută programări confirmate care au depășit o anumită oră
    List<Booking> findByStatusAndEndTimeBefore(String status, LocalDateTime time);
}