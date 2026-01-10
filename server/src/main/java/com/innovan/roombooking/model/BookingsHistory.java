package com.innovan.roombooking.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "BOOKINGS_HISTORY")
public class BookingsHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_bookings_history")
    @SequenceGenerator(name = "seq_bookings_history", allocationSize = 1)
    private Long bookingsHistoryId;

    @Column(name = "booking_id")
    private Long bookingsId;

    private Long userId;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;

    @Column(name = "created_date")
    private LocalDate createdDate;

    @Column(name = "updated_date")
    private LocalDate updatedDate;
}
