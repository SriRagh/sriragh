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
@Table(name = "ROOMS")
public class Rooms {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_rooms")
    @SequenceGenerator(name = "seq_rooms", allocationSize = 1)
    private Long roomId;

    private String roomName;

    @Column(name = "maintainance_flag", columnDefinition = "CHAR")
    private String maintenance;

    private int capacity;
    private String equipments;
    private String location;

    @Column(name = "status", nullable = false)
    private String status = "Active";
}
