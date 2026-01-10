"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  startTransition,
} from "react";
import type {
  Booking,
  BookingDto,
  CreateBookingPayload,
  UpdateBookingPayload,
  BookingContextType,
  Room,
} from "@/lib/types";
import { useAuth } from "./auth-context";
import * as api from "@/lib/api";
import {
  parseISO,
  isSameDay,
  startOfDay,
  isAfter,
  format,
  getMonth,
  getYear,
  isBefore,
  isPast,
  isWithinInterval,
  parse,
} from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useRooms } from "./room-context";
import { sendEmail } from "@/ai/flows/send-email-flow";

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const parseApiDate = (dateString: string): Date => {
  // Handles both ISO format from some endpoints and M/d/yyyy... from others.
  if (dateString.includes("T")) {
    return parseISO(dateString);
  }
  // This format comes from the backend: "11/23/2025 16:30:00"
  return parse(dateString, "M/d/yyyy HH:mm:ss", new Date());
};

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { rooms, isLoading: roomsLoading } = useRooms();
  const { toast } = useToast();

  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [viewDate, setViewDate] = useState(startOfDay(new Date()));
  const [isLoading, setIsLoading] = useState(true);

  const mapDtoToBooking = useCallback(
    (dto: BookingDto, currentRooms: Room[]): Booking | null => {
      const bookingId = dto.bookingId ?? Date.now() + Math.random();

      let roomName = dto.roomName;
      let roomLocation;

      if (dto.roomId) {
        const room = currentRooms.find((r) => r.id === dto.roomId);
        if (room) {
          roomName = room.name;
          roomLocation = room.location;
        }
      }

      if (!roomName) {
        const room = currentRooms.find((r) => r.id === dto.roomId);
        if (room) {
          roomName = room.name;
        } else {
          if (!dto.roomName) return null;
        }
      }

      if (!dto.startTime || !dto.endTime) {
        console.error("Booking DTO is missing time information:", dto);
        return null;
      }

      return {
        id: bookingId,
        roomId: dto.roomId || 0,
        roomName: roomName,
        title: dto.bookingTitle || "Untitled Meeting",
        bookedBy: dto.userName || dto.bookedUser || "Unknown",
        startTime: parseApiDate(dto.startTime),
        endTime: parseApiDate(dto.endTime),
        location: dto.location || roomLocation || "Unknown",
      };
    },
    []
  );

  const fetchBookings = useCallback(async () => {
    if (!user || !rooms.length) return;

    try {
      const month = getMonth(viewDate) + 1;
      const year = getYear(viewDate);

      const [roomInfo, todayPast, future] = await Promise.all([
        api.getRoomInformation(month, year),
        api.getTodayAndPastBookings(),
        api.getFutureBookings(),
      ]);

      const monthBookings = roomInfo.month || [];
      const todayFromRoomInfo = roomInfo.today || [];

      const combinedBookings = [
        ...monthBookings,
        ...todayFromRoomInfo,
        ...todayPast,
        ...future,
      ].filter((dto) => dto && dto.startTime && dto.endTime);

      const allFetchedBookings = combinedBookings
        .map((dto) => mapDtoToBooking(dto, rooms))
        .filter((b): b is Booking => b !== null);

      const uniqueBookings = Array.from(
        new Map(allFetchedBookings.map((b) => [b.id, b])).values()
      );
      startTransition(() => {
        setAllBookings(uniqueBookings);
      });
    } catch (error) {
      console.error("Failed to fetch booking information:", error);
      setAllBookings([]);
    }
  }, [user, mapDtoToBooking, viewDate, rooms]);

  const fetchMyBookings = useCallback(
    async (userId: string | number) => {
      if (!user || !rooms.length) return;
      setIsLoading(true);
      try {
        const myBookingDtos = await api.getRoomInfoUser(userId);
        const mappedBookings = myBookingDtos
          .map((dto) => mapDtoToBooking(dto, rooms))
          .filter((b): b is Booking => b !== null);

        const uniqueBookings = Array.from(
          new Map(mappedBookings.map((b) => [b.id, b])).values()
        );
        startTransition(() => {
          setMyBookings(uniqueBookings);
        });
      } catch (error) {
        console.error("Failed to fetch user-specific bookings:", error);
        setMyBookings([]);
      } finally {
        setIsLoading(false);
      }
    },
    [user, mapDtoToBooking, rooms]
  );

  useEffect(() => {
    if (!authLoading && user && !roomsLoading && rooms.length > 0) {
      setIsLoading(true);
      Promise.all([fetchBookings(), fetchMyBookings(user.id)]).finally(() => {
        setIsLoading(false);
      });
    } else if (!authLoading && !user) {
      setAllBookings([]);
      setMyBookings([]);
      setIsLoading(false);
    }
  }, [authLoading, user, roomsLoading, rooms, fetchBookings, fetchMyBookings]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (user && rooms.length > 0) {
        fetchBookings();
        if (user?.id) {
          fetchMyBookings(user.id);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, rooms, fetchBookings, fetchMyBookings]);

  const { todaysBookings, upcomingBookings, pastBookings } = useMemo(() => {
    const now = new Date();

    const todays: Booking[] = [];
    const upcoming: Booking[] = [];
    const past: Booking[] = [];

    for (const b of allBookings) {
      if (!b.startTime) continue;
      if (isPast(b.endTime)) {
        past.push(b);
      } else if (isSameDay(b.startTime, now)) {
        todays.push(b);
      } else if (isAfter(b.startTime, now)) {
        upcoming.push(b);
      }
    }

    return {
      todaysBookings: todays.sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      ),
      upcomingBookings: upcoming.sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      ),
      pastBookings: past.sort(
        (a, b) => b.startTime.getTime() - a.startTime.getTime()
      ),
    };
  }, [allBookings]);

  const {
    myTodaysBookings,
    myUpcomingBookings,
    myPastBookings,
    myOngoingBookings,
  } = useMemo(() => {
    if (!user || !myBookings || myBookings.length === 0)
      return {
        myTodaysBookings: [],
        myUpcomingBookings: [],
        myPastBookings: [],
        myOngoingBookings: [],
      };

    const now = new Date();

    const myTodays: Booking[] = [];
    const myUpcoming: Booking[] = [];
    const myPast: Booking[] = [];
    const myOngoing: Booking[] = [];

    const lowerCaseUsername = user.username.toLowerCase();
    const lowerCaseFirstName = user.firstName.toLowerCase();

    for (const b of myBookings) {
      if (!b.startTime || !b.bookedBy) continue;

      const lowerCaseBookedBy = b.bookedBy.toLowerCase();

      const isMyBooking =
        lowerCaseBookedBy.includes(lowerCaseUsername) ||
        lowerCaseBookedBy.includes(lowerCaseFirstName);

      if (!isMyBooking) continue;

      if (isPast(b.endTime)) {
        myPast.push(b);
      } else if (
        isWithinInterval(now, { start: b.startTime, end: b.endTime })
      ) {
        myOngoing.push(b);
      } else if (isAfter(b.startTime, now)) {
        myUpcoming.push(b);
      } else if (isSameDay(b.startTime, now) && !isPast(b.endTime)) {
        myTodays.push(b);
      }
    }

    return {
      myTodaysBookings: myTodays.sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      ),
      myUpcomingBookings: myUpcoming.sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      ),
      myPastBookings: myPast.sort(
        (a, b) => b.startTime.getTime() - a.startTime.getTime()
      ),
      myOngoingBookings: myOngoing.sort(
        (a, b) => a.startTime.getTime() - a.startTime.getTime()
      ),
    };
  }, [myBookings, user]);

  const addBooking = useCallback(
    async (bookingDetails: Omit<Booking, "id" | "roomName">) => {
      if (!user) throw new Error("User not authenticated");

      const isOverlapping = allBookings.some(
        (existingBooking) =>
          bookingDetails.roomId === existingBooking.roomId &&
          bookingDetails.startTime < existingBooking.endTime &&
          bookingDetails.endTime > existingBooking.startTime
      );

      if (isOverlapping) {
        throw new Error(
          "This time slot is no longer available. Please select another time."
        );
      }

      if (!bookingDetails.location) {
        throw new Error("Location is missing");
      }

      const timeZone =
        bookingDetails.location === "Hyderabad"
          ? "Asia/Kolkata"
          : "Pacific/Honolulu";

      const startTimeString = format(
        bookingDetails.startTime,
        "MM/dd/yyyy hh:mm:ss a"
      );
      const endTimeString = format(
        bookingDetails.endTime,
        "MM/dd/yyyy hh:mm:ss a"
      );

      const payload: CreateBookingPayload = {
        userId: Number(user.id),
        roomId: bookingDetails.roomId,
        bookingTitle:
          bookingDetails.title || `Booking for room ${bookingDetails.roomId}`,
        requirements: bookingDetails.requirements,
        userName: user.username,
        location: bookingDetails.location,
        startTime: startTimeString,
        endTime: endTimeString,
        timeZone: timeZone,
      };
      try {
        await api.createBooking(payload);
        await Promise.all([fetchBookings(), fetchMyBookings(user.id)]);

        const room = rooms.find((r) => r.id === bookingDetails.roomId);

        // Send confirmation email
        await sendEmail({
          to: user.email,
          subject: "Your Conference Room Booking is Confirmed!",
          body: `
                <h1>Booking Confirmation</h1>
                <p>Hello ${user.firstName},</p>
                <p>Your booking for the conference room has been confirmed.</p>
                <h3>Details:</h3>
                <ul>
                    <li><strong>Room:</strong> ${room?.name || "N/A"}</li>
                    <li><strong>Meeting:</strong> ${bookingDetails.title}</li>
                    <li><strong>Date:</strong> ${format(
                      bookingDetails.startTime,
                      "PPP"
                    )}</li>
                    <li><strong>Time:</strong> ${format(
                      bookingDetails.startTime,
                      "p"
                    )} - ${format(bookingDetails.endTime, "p")}</li>
                </ul>
                <p>Thank you for using our booking system.</p>
            `,
        });
      } catch (error: any) {
        throw new Error(
          error.message || "An unknown error occurred while booking."
        );
      }
    },
    [user, fetchBookings, fetchMyBookings, allBookings, rooms]
  );

  const updateBooking = useCallback(
    async (bookingId: number, payload: UpdateBookingPayload) => {
      if (!user) return;
      try {
        await api.updateBooking(bookingId, payload);
        toast({
          title: "Booking Updated",
          description: "Your booking has been successfully updated.",
        });
        await Promise.all([fetchBookings(), fetchMyBookings(user.id)]);
      } catch (error) {
        console.error("Failed to update booking:", error);
        toast({
          title: "Error",
          description: "Could not update the booking. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [fetchBookings, fetchMyBookings, toast, user]
  );

  const cancelBooking = useCallback(
    async (bookingId: number) => {
      if (!user) return;
      try {
        await api.deleteBooking(bookingId);
        toast({
          title: "Booking Canceled",
          description: `Your booking has been successfully canceled.`,
        });
        await Promise.all([fetchBookings(), fetchMyBookings(user.id)]);
      } catch (error) {
        console.error("Failed to cancel booking:", error);
        toast({
          title: "Error",
          description: "Could not cancel the booking. Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [fetchBookings, fetchMyBookings, toast, user]
  );

  const contextValue = useMemo(
    () => ({
      bookings: allBookings,
      myBookings,
      todaysBookings,
      upcomingBookings,
      pastBookings,
      myTodaysBookings,
      myUpcomingBookings,
      myPastBookings,
      myOngoingBookings,
      addBooking,
      updateBooking,
      cancelBooking,
      viewDate,
      setViewDate,
      isLoading,
      fetchBookings,
      fetchMyBookings,
    }),
    [
      allBookings,
      myBookings,
      todaysBookings,
      upcomingBookings,
      pastBookings,
      myTodaysBookings,
      myUpcomingBookings,
      myPastBookings,
      myOngoingBookings,
      addBooking,
      updateBooking,
      cancelBooking,
      viewDate,
      isLoading,
      fetchBookings,
      fetchMyBookings,
    ]
  );

  return (
    <BookingContext.Provider value={contextValue}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBookings must be used within a BookingProvider");
  }
  return context;
};
