package com.example.bookingservice.scheduler;

import com.example.bookingservice.model.Booking;
import com.example.bookingservice.repository.BookingRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class BookingStatusScheduler {

    private final BookingRepository bookingRepository;

    public BookingStatusScheduler(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @Scheduled(cron = "0 * * * * ?")
    @Transactional
    public void updatePastBookingsToCompleted() {
        LocalDateTime now = LocalDateTime.now();

        // Căutăm toate programările care au rămas "CONFIRMED" deși ora lor de sfârșit (endTime) a trecut
        List<Booking> pastBookings = bookingRepository.findByStatusAndEndTimeBefore("CONFIRMED", now);

        if (!pastBookings.isEmpty()) {
            for (Booking b : pastBookings) {
                b.setStatus("COMPLETED");
            }
            bookingRepository.saveAll(pastBookings);

            // Lăsăm un mesaj în consolă ca să știm că robotul și-a făcut treaba
            System.out.println("🤖 Cron Job Executat: Am marcat " + pastBookings.size() + " programări vechi ca fiind COMPLETED.");
        }
    }
}