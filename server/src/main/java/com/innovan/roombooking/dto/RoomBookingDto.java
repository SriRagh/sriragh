package com.innovan.roombooking.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDate;
import lombok.Data;
import lombok.NoArgsConstructor;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class RoomBookingDto {

    private Long roomId;
    private String roomName;
    private long availableCount;
    private int capacity;
    private long maintenanceCount;
    private int totalRoomCount;
    private String slotName;
    private long bookingId;
    private String equipments;
    private LocalDate bookingDate;

    public RoomBookingDto() {
    }

    public RoomBookingDto(long availableCount, long maintenanceCount, int totalRoomCount) {
        this.availableCount = availableCount;
        this.maintenanceCount = maintenanceCount;
        this.totalRoomCount = totalRoomCount;
    }

    public RoomBookingDto(
            Number bookingId,
            String roomName,
            String slotName,
            Number capacity,
            String equipments,
            LocalDate bookingDate) {
        this.bookingId = bookingId.longValue();
        this.roomName = roomName;
        this.slotName = slotName;
        this.capacity = capacity.intValue();
        this.equipments = equipments;
        this.bookingDate = bookingDate;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public long getAvailableCount() {
        return availableCount;
    }

    public void setAvailableCount(long availableCount) {
        this.availableCount = availableCount;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public long getMaintenanceCount() {
        return maintenanceCount;
    }

    public void setMaintenanceCount(long maintenanceCount) {
        this.maintenanceCount = maintenanceCount;
    }

    public int getTotalRoomCount() {
        return totalRoomCount;
    }

    public void setTotalRoomCount(int totalRoomCount) {
        this.totalRoomCount = totalRoomCount;
    }

    public String getSlotName() {
        return slotName;
    }

    public void setSlotName(String slotName) {
        this.slotName = slotName;
    }

    public long getBookingId() {
        return bookingId;
    }

    public void setBookingId(long bookingId) {
        this.bookingId = bookingId;
    }

    public String getEquipments() {
        return equipments;
    }

    public void setEquipments(String equipments) {
        this.equipments = equipments;
    }

    public LocalDate getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(LocalDate bookingDate) {
        this.bookingDate = bookingDate;
    }

}
