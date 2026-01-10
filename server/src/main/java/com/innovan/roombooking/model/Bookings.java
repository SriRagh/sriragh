package com.innovan.roombooking.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "BOOKINGS")
public class Bookings {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_bookings")
    @SequenceGenerator(name = "seq_bookings", allocationSize = 1)
    @Column(name = "booking_id")
    private Long bookingsId;

    private Long userId;
    private Long roomId;

    @Column(name = "is_finished", columnDefinition = "CHAR", length = 1)
    private String isFinished;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "booking_title")
    private String bookingTitle;

    @Column(name = "location")
    private String location;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;
}
