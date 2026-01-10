package com.innovan.roombooking.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class BookingDto {

    private Long bookingId;
    private Long userId;
    private Long roomId;
    private String userName;
    private String roomName;
    private String equipments;
    private Integer capacity;
    private String bookingTitle;
    private String bookedBy;
    private String createdBy;
    private LocalDate createdDate;
    private String location;
    private String startTime;
    private String endTime;

    public BookingDto(Long bookingId, String userName, String roomName) {
        this.bookingId = bookingId;
        this.userName = userName;
        this.roomName = roomName;
    }

    public BookingDto(
            String roomName,
            String bookingTitle,
            String bookedBy,
            LocalDate createdDate) {
        this.roomName = roomName;
        this.bookingTitle = bookingTitle;
        this.bookedBy = bookedBy;
        this.createdDate = createdDate;
    }

    public BookingDto(
            Long bookingId,
            String userName,
            String roomName,
            String bookingTitle,
            String bookedBy,
            LocalDate createdDate) {
        this.bookingId = bookingId;
        this.userName = userName;
        this.roomName = roomName;
        this.bookingTitle = bookingTitle;
        this.bookedBy = bookedBy;
        this.createdDate = createdDate;
    }

    public BookingDto(Long bookingId, String roomName, LocalDateTime createdDate) {
        this.bookingId = bookingId;
        this.roomName = roomName;
        this.createdDate = createdDate.toLocalDate();
    }

    public BookingDto() {
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public String getEquipments() {
        return equipments;
    }

    public void setEquipments(String equipments) {
        this.equipments = equipments;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getBookingTitle() {
        return bookingTitle;
    }

    public void setBookingTitle(String bookingTitle) {
        this.bookingTitle = bookingTitle;
    }

    public String getBookedBy() {
        return bookedBy;
    }

    public void setBookedBy(String bookedBy) {
        this.bookedBy = bookedBy;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDate getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(LocalDate createdDate) {
        this.createdDate = createdDate;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

}
