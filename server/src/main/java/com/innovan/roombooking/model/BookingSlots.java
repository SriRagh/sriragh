package com.innovan.roombooking.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "BOOKING_SLOTS")
public class BookingSlots {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_booking_slots")
    @SequenceGenerator(name = "seq_booking_slots", allocationSize = 1)
    private Long bookingSlotId;

    @Column(name = "slot_name")
    private String slots;
}
