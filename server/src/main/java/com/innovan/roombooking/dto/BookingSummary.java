package com.innovan.roombooking.dto;

import java.time.LocalDateTime;

public record BookingSummary(
    Long bookingId,
    String roomName,
    LocalDateTime createdDate,
    String bookingTitle,
    String bookedUser,
    Long roomId,
    String location,
    LocalDateTime startTime,
    LocalDateTime endTime
) {}
