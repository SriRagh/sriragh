package com.innovan.roombooking.dto;

import java.time.LocalDate;

public interface RoomBookingDtoN {
    Long getBookingId();
    Long getRoomId();
    String getRoomName();
    String getSlotName();
    Integer getCapacity();
    String getEquipments();
    LocalDate getBookingDate();
}
