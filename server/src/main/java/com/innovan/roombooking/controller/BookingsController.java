package com.innovan.roombooking.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.innovan.roombooking.dto.BookingDto;
import com.innovan.roombooking.dto.BookingSummary;
import com.innovan.roombooking.model.Bookings;
import com.innovan.roombooking.service.BookingService;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingsController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping("/futureBookings")
    public ResponseEntity<List<BookingDto>> getFutureBookings() {
        List<BookingDto> futureBookings = bookingService.getFutureBookings();
        return ResponseEntity.ok(futureBookings);
    }

    @GetMapping("/todayPastBookings")
    public ResponseEntity<List<BookingDto>> getTodayBookings() {
        return ResponseEntity.ok(bookingService.getTodayBookings());
    }

    @PostMapping("/create")
    public ResponseEntity<BookingDto> createBooking(@RequestBody BookingDto bookingRequest) {
        Bookings savedBooking = bookingService.createBooking(bookingRequest);
        return ResponseEntity.ok(objectMapper.convertValue(savedBooking, BookingDto.class));
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<BookingDto> updateBooking(
        @PathVariable Long id,
        @RequestBody BookingDto bookingRequest
    ) {
        Bookings savedBooking = bookingService.updateBooking(id, bookingRequest);
        return ResponseEntity.ok(objectMapper.convertValue(savedBooking, BookingDto.class));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteBooking(@PathVariable Long id) {
        bookingService.deleteBooking(id);
        return ResponseEntity.ok("Booking deleted successfully");
    }

    @GetMapping("/finishedBookings")
    public ResponseEntity<Long> getFinishedBookingCount() {
        return ResponseEntity.ok(bookingService.getFinishedBookingCount());
    }

    @GetMapping("/ongoingCount")
    public ResponseEntity<Long> getOngoingBookingCountForToday() {
        return ResponseEntity.ok(bookingService.getOngoingBookingCountForToday());
    }

    @GetMapping("/getRoomInformation")
    public ResponseEntity<Map<String, List<BookingSummary>>> getBookingInfo(
        @RequestParam int month,
        @RequestParam int year
    ) {
        return ResponseEntity.ok(bookingService.roomBookingInfo(month, year));
    }

    @GetMapping("/getRoomInfoUser")
    public ResponseEntity<List<BookingSummary>> getBookingInfoForUser(@RequestParam int userId) {
        return ResponseEntity.ok(bookingService.bookingSummariesForUser(userId));
    }

    @GetMapping("/allBookings")
    public ResponseEntity<List<BookingDto>> getAllBookings() {
        List<BookingDto> allBookings = bookingService.getAllBookings();
        return ResponseEntity.ok(allBookings);
    }
}
