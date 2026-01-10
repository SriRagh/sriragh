package com.innovan.roombooking.repository;

import com.innovan.roombooking.dto.BookingSummary;
import com.innovan.roombooking.model.Bookings;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BookingRepository extends JpaRepository<Bookings, Long> {
    @Query(
        value = """
        SELECT b.booking_id,
               u.user_name,
               r.room_name,
               b.created_by,
               b.created_date,
               b.booking_title,
               b.location
          FROM bookings b
          JOIN rooms r ON b.room_id = r.room_id
          JOIN users u ON b.user_id = u.user_id
         WHERE TRUNC(b.start_time) >= TRUNC(SYSDATE)
         ORDER BY b.booking_id
        """,
        nativeQuery = true
    )
    List<Object[]> findFutureBookings();

    @Query(
        value = """
                SELECT
                                                 	r.room_name AS roomName,
                                                 	b.booking_title AS bookingTitle,
                                                 	b.created_by AS bookedBy,
                                                 	TRUNC(b.start_time) AS createdDate,
                                                 	b.location
                                                 FROM
                                                 	bookings b
                                                 JOIN rooms r ON
                                                 	b.room_id = r.room_id
                                                 WHERE
                                                 	TRUNC(b.START_TIME) <= TRUNC(SYSDATE)
                                                 ORDER BY
                                                 	b.START_TIME  DESC
               \s
       \s""",
        nativeQuery = true
    )
    List<Object[]> findTodayAndPastBookings();

    @Query(value = "SELECT COUNT(*) FROM bookings WHERE is_finished = 'Y'", nativeQuery = true)
    Long countFinishedBookings();

    @Query(
        """
    SELECT new com.innovan.roombooking.dto.BookingSummary(
        b.bookingsId,
        r.roomName,
        b.createdDate,
        b.bookingTitle,
        CONCAT(u.lastName, ' ', u.firstName),
        r.roomId,
        b.location,
        b.startTime,
        b.endTime
    )
    FROM Bookings b
    JOIN Rooms r ON r.roomId = b.roomId
    JOIN UserInformation u ON u.userId = b.userId
    WHERE b.startTime >= :todayStart
      AND b.startTime < :tomorrowStart
"""
    )
    List<BookingSummary> findTodayBookings(
        @Param("todayStart") LocalDateTime todayStart,
        @Param("tomorrowStart") LocalDateTime tomorrowStart
    );

    @Query(
        """
    SELECT new com.innovan.roombooking.dto.BookingSummary(
        b.bookingsId,
        r.roomName,
        b.createdDate,
        b.bookingTitle,
        CONCAT(u.lastName, ' ', u.firstName),
        r.roomId,
        b.location,
        b.startTime,
        b.endTime
    )
    FROM Bookings b
    JOIN Rooms r ON r.roomId = b.roomId
    JOIN UserInformation u ON u.userId = b.userId
    WHERE b.startTime >= :monthStart
      AND b.startTime < :nextMonthStart
"""
    )
    List<BookingSummary> findBookingsForMonth(
        @Param("monthStart") LocalDateTime monthStart,
        @Param("nextMonthStart") LocalDateTime nextMonthStart
    );

    @Query(
        """
        SELECT new com.innovan.roombooking.dto.BookingSummary(
                   b.bookingsId,
                   r.roomName,
                   b.createdDate,
                   b.bookingTitle,
                   CONCAT(ui.lastName, ' ', ui.firstName),
                   r.roomId,
                   b.location,
                   b.startTime,
                   b.endTime
               )
          FROM Bookings b
          JOIN Rooms r ON r.roomId = b.roomId
          JOIN UserInformation ui ON ui.userId = b.userId
         WHERE b.userId = :userId
    """
    )
    List<BookingSummary> findBookingsForUser(@Param("userId") int userId);

    @Query(
        """
        SELECT b.bookingsId
          FROM Bookings b
         WHERE b.isFinished <> 'Y'
           AND b.createdDate <= :monthStart
    """
    )
    List<Long> findNotFinishedBookings(@Param("monthStart") LocalDateTime monthStart);

    @Query(
        """
        SELECT b FROM Bookings b
        WHERE b.roomId = :roomId
          AND b.isFinished = 'N'
          AND (
                (:startTime < b.endTime AND :endTime > b.startTime)
          )
    """
    )
    List<Bookings> findOverlappingBookings(
        @Param("roomId") Long roomId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime
    );

    @Query(
        """
    SELECT b FROM Bookings b
    WHERE b.roomId = :roomId
      AND b.isFinished = 'N'
      AND b.bookingsId <> :bookingId
      AND (
            (:startTime < b.endTime AND :endTime > b.startTime)
          )
"""
    )
    List<Bookings> findOverlappingBookingsForUpdate(
        @Param("roomId") Long roomId,
        @Param("startTime") LocalDateTime startTime,
        @Param("endTime") LocalDateTime endTime,
        @Param("bookingId") Long bookingId
    );
}
