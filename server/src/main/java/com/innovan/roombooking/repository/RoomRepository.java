package com.innovan.roombooking.repository;

import com.innovan.roombooking.dto.RoomBookingDtoN;
import com.innovan.roombooking.model.Rooms;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomRepository extends JpaRepository<Rooms, Long> {
    @Query(
        value = "SELECT " +
        "b.BOOKING_ID AS bookingId, " +
        "r.ROOM_ID AS roomId, " +
        "r.ROOM_NAME AS roomName, " +
        "r.CAPACITY AS capacity, " +
        "r.EQUIPMENTS AS equipments, " +
        "CAST(b.CREATED_DATE AS DATE) AS bookingDate " +
        "FROM BOOKINGS b " +
        "JOIN ROOMS r ON r.ROOM_ID = b.ROOM_ID " +
        "WHERE r.MAINTAINANCE_FLAG <> 'Y'AND r.status='Active'",
        nativeQuery = true
    )
    List<RoomBookingDtoN> getRooms();

    List<Rooms> findByStatus(String status);
}
