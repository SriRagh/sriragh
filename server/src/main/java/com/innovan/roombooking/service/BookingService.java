package com.innovan.roombooking.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.innovan.roombooking.auth.IAuthenticationFacade;
import com.innovan.roombooking.dto.BookingDto;
import com.innovan.roombooking.dto.BookingSummary;
import com.innovan.roombooking.handler.SlotAlreadyBookedException;
import com.innovan.roombooking.model.Bookings;
import com.innovan.roombooking.repository.BookingRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.CriteriaUpdate;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final IAuthenticationFacade authenticationFacade;
    private final EntityManager em;
    private final ObjectMapper objectMapper;

    public BookingService(
            BookingRepository bookingRepository,
            IAuthenticationFacade authenticationFacade,
            EntityManager em,
            ObjectMapper objectMapper) {
        this.bookingRepository = bookingRepository;
        this.authenticationFacade = authenticationFacade;
        this.em = em;
        this.objectMapper = objectMapper;
    }

    public List<BookingDto> getFutureBookings() {
        List<Object[]> results = bookingRepository.findFutureBookings();

        return results
                .stream()
                .map(obj -> {
                    BookingDto dto = new BookingDto();
                    dto.setBookingId(((BigDecimal) obj[0]).longValue());
                    dto.setUserName((String) obj[1]);
                    dto.setRoomName((String) obj[2]);
                    dto.setBookedBy((String) obj[3]);

                    LocalDate createdDate = null;
                    if (obj[4] != null) {
                        if (obj[4] instanceof Timestamp ts) {
                            createdDate = ts.toLocalDateTime().toLocalDate();
                        } else if (obj[4] instanceof Date d) {
                            createdDate = d.toLocalDate();
                        }
                    }
                    dto.setCreatedDate(createdDate);
                    dto.setBookingTitle((String) obj[5]);
                    dto.setLocation((String) obj[6]);

                    return dto;
                })
                .toList();
    }

    public List<BookingDto> getTodayBookings() {
        List<Object[]> rows = bookingRepository.findTodayAndPastBookings();
        List<BookingDto> result = new ArrayList<>();

        for (Object[] row : rows) {
            LocalDate createdDate = null;
            if (row[3] != null) {
                if (row[3] instanceof Timestamp timestamp) {
                    createdDate = timestamp.toLocalDateTime().toLocalDate();
                } else if (row[3] instanceof Date date) {
                    createdDate = date.toLocalDate();
                } else {
                    log.info("{}", row[3]);
                }
            }

            result.add(
                    new BookingDto((String) row[0], (String) row[1], (String) row[2], createdDate));
        }

        return result;
    }

    public Bookings createBooking(BookingDto dto) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(
                "MM/dd/yyyy hh:mm:ss a",
                Locale.US);

        LocalDateTime startLocal = LocalDateTime.from(formatter.parse(dto.getStartTime()));
        LocalDateTime endLocal = LocalDateTime.from(formatter.parse(dto.getEndTime()));

        List<Bookings> overlapping = bookingRepository.findOverlappingBookings(
                dto.getRoomId(),
                startLocal,
                endLocal);

        if (!overlapping.isEmpty()) {
            throw new SlotAlreadyBookedException(
                    "This slot is already booked. Please try another time.");
        }
        Bookings booking = getBookings(dto);

        return bookingRepository.save(booking);
    }

    private Bookings getBookings(BookingDto dto) {
        Bookings booking = new Bookings();
        booking.setUserId(dto.getUserId());
        booking.setRoomId(dto.getRoomId());
        booking.setBookingTitle(dto.getBookingTitle());
        booking.setLocation(dto.getLocation());

        UserDetails userDetails = authenticationFacade.getUserDetails();
        booking.setCreatedBy(userDetails.getUsername());
        if (dto.getLocation().equalsIgnoreCase("Hyderabad")) {
            String timeZone = "Asia/Kolkata";

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern(
                    "MM/dd/yyyy hh:mm:ss a",
                    Locale.US);

            LocalDateTime startLocal = LocalDateTime.from(formatter.parse(dto.getStartTime()));
            LocalDateTime endLocal = LocalDateTime.from(formatter.parse(dto.getEndTime()));

            ZoneId zone = ZoneId.of(timeZone);
            ZonedDateTime startZoned = startLocal.atZone(zone);
            ZonedDateTime endZoned = endLocal.atZone(zone);

            booking.setStartTime(startZoned.toLocalDateTime());
            booking.setEndTime(endZoned.toLocalDateTime());
        } else if (dto.getLocation().equalsIgnoreCase("Hawaii")) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern(
                    "MM/dd/yyyy hh:mm:ss a",
                    Locale.US);

            LocalDateTime startLocal = LocalDateTime.from(formatter.parse(dto.getStartTime()));
            LocalDateTime endLocal = LocalDateTime.from(formatter.parse(dto.getEndTime()));
            booking.setCreatedDate(
                    dto
                            .getCreatedDate()
                            .atStartOfDay()
                            .atZone(ZoneId.of("Pacific/Honolulu"))
                            .toLocalDateTime());
            booking.setStartTime(
                    startLocal.atZone(ZoneId.of("Pacific/Honolulu")).toLocalDateTime());
            booking.setEndTime(endLocal.atZone(ZoneId.of("Asia/Kolkata")).toLocalDateTime());
        }
        booking.setIsFinished("N");
        return booking;
    }

    public Long getFinishedBookingCount() {
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();

        List<Long> bookingIds = bookingRepository.findNotFinishedBookings(todayStart);

        if (bookingIds.isEmpty()) {
            log.info("No unfinished bookings found before today.");
            return bookingRepository.countFinishedBookings();
        }

        CriteriaBuilder builder = em.getCriteriaBuilder();
        CriteriaUpdate<Bookings> update = builder.createCriteriaUpdate(Bookings.class);
        Root<Bookings> root = update.from(Bookings.class);

        update.set("isFinished", "Y");
        update.where(root.get("bookingsId").in(bookingIds));

        int updatedRows = em.createQuery(update).executeUpdate();
        log.info("Updated {} unfinished bookings to finished.", updatedRows);

        return bookingRepository.countFinishedBookings();
    }

    public Long getOngoingBookingCountForToday() {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);
        Root<Bookings> booking = cq.from(Bookings.class);
        Predicate notFinished = cb.notEqual(booking.get("isFinished"), "Y");

        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);

        Predicate createdToday = cb.between(
                booking.get("createdDate"),
                Timestamp.valueOf(today.atStartOfDay()),
                Timestamp.valueOf(tomorrow.atStartOfDay().minusNanos(1)));

        cq.multiselect(cb.count(booking)).where(cb.and(notFinished, createdToday));

        return em.createQuery(cq).getSingleResult();
    }

    public Map<String, List<BookingSummary>> roomBookingInfo(int month, int year) {
        LocalDate today = LocalDate.now();
        LocalDateTime todayStart = today.atStartOfDay();
        LocalDateTime tomorrowStart = today.plusDays(1).atStartOfDay();

        List<BookingSummary> todayBookings = bookingRepository.findTodayBookings(
                todayStart,
                tomorrowStart);

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime monthStart = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime nextMonthStart = yearMonth.plusMonths(1).atDay(1).atStartOfDay();

        List<BookingSummary> monthBookings = bookingRepository.findBookingsForMonth(
                monthStart,
                nextMonthStart);

        Map<String, List<BookingSummary>> roomMap = new HashMap<>();
        roomMap.put("today", todayBookings);
        roomMap.put("month", monthBookings);
        return roomMap;
    }

    public List<BookingSummary> bookingSummariesForUser(int userId) {
        return bookingRepository.findBookingsForUser(userId);
    }

    public Bookings updateBooking(Long bookingId, BookingDto dto) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(
                "MM/dd/yyyy hh:mm:ss a",
                Locale.US);

        LocalDateTime startLocal = LocalDateTime.from(formatter.parse(dto.getStartTime()));
        LocalDateTime endLocal = LocalDateTime.from(formatter.parse(dto.getEndTime()));

        List<Bookings> overlapping = bookingRepository.findOverlappingBookingsForUpdate(
                dto.getRoomId(),
                startLocal,
                endLocal,
                bookingId);

        if (!overlapping.isEmpty()) {
            throw new SlotAlreadyBookedException(
                    "This slot is already booked. Please try another time.");
        }

        return bookingRepository
                .findById(bookingId)
                .map(existing -> {
                    existing.setUserId(dto.getUserId());
                    existing.setRoomId(dto.getRoomId());
                    existing.setStartTime(startLocal);
                    existing.setEndTime(endLocal);
                    existing.setBookingTitle(dto.getBookingTitle());
                    existing.setLocation(dto.getLocation());

                    UserDetails userDetails = authenticationFacade.getUserDetails();
                    existing.setUpdatedBy(userDetails.getUsername());
                    existing.setUpdatedDate(LocalDateTime.now());

                    return bookingRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));
    }

    public void deleteBooking(Long bookingId) {
        if (!bookingRepository.existsById(bookingId)) {
            throw new RuntimeException("Booking not found with id: " + bookingId);
        }
        bookingRepository.deleteById(bookingId);
    }

    public List<BookingDto> getAllBookings() {
        List<BookingDto> list = new ArrayList<>();
        for (Bookings booking : bookingRepository.findAll()) {
            BookingDto bookingDto = objectMapper.convertValue(booking, BookingDto.class);
            list.add(bookingDto);
        }
        return list;
    }
}
