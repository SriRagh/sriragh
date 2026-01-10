package com.innovan.roombooking.dto;

public record RoomsDto(
    Long roomId,
    String roomName,
    String maintenance,
    int capacity,
    String equipments,
    String location,
    String status
) {}
