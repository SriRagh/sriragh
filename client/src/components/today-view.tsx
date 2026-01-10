"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { format, set, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import type { Booking, Room } from "@/lib/types";
import { useBookings } from "@/context/booking-context";
import { Skeleton } from "./ui/skeleton";
import { useRooms } from "@/context/room-context";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

const hours = Array.from({ length: 11 }, (_, i) => i + 8); // 8 AM to 6 PM (18:00)

const roomDotColors: { [key: string]: string } = {
  Vayu: "bg-red-500",
  Prithvi: "bg-blue-500",
  Jal: "bg-green-500",
  Akash: "bg-yellow-500",
  Haleakala: "bg-indigo-500",
  Pali: "bg-purple-500",
  "Napali Coast": "bg-pink-500",
  Hanalei: "bg-orange-500",
  Kilauea: "bg-teal-500",
};

interface TodayViewProps {
  title?: string;
  showDatePicker?: boolean;
  roomsToShow?: Room[];
}

const timelineStartHour = 8;
const timelineEndHour = 18; // 6 PM
const totalTimelineMinutes = (timelineEndHour - timelineStartHour) * 60;

const BookingBar = React.memo(({ booking }: { booking: Booking }) => {
  const { left, width } = useMemo(() => {
    const startOfTimeline = set(booking.startTime, {
      hours: timelineStartHour,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    });
    const startOffsetMinutes = Math.max(
      0,
      differenceInMinutes(booking.startTime, startOfTimeline)
    );
    const durationMinutes = differenceInMinutes(
      booking.endTime,
      booking.startTime
    );

    const totalHoursInTimeline = hours.length;

    // Calculate position and width based on the number of hourly columns
    const l = (startOffsetMinutes / 60 / totalHoursInTimeline) * 100;
    const w = (durationMinutes / 60 / totalHoursInTimeline) * 100;

    return { left: l, width: w };
  }, [booking.startTime, booking.endTime, hours.length]);

  const bgColor = roomDotColors[booking.roomName] || "bg-gray-400";

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "absolute top-1 bottom-1 px-2 text-xs z-10 overflow-hidden flex flex-col justify-center rounded-md text-white",
            bgColor
          )}
          style={{
            left: `${left}%`,
            width: `${width}%`,
          }}
        >
          <p className="font-bold truncate">{booking.title}</p>
        </div>
      </TooltipTrigger>
      <TooltipContent sideOffset={8}>
        <p className="font-bold">{booking.title}</p>
        <p>Booked by: {booking.bookedBy}</p>
        <p>
          {format(booking.startTime, "p")} - {format(booking.endTime, "p")}
        </p>
      </TooltipContent>
    </Tooltip>
  );
});
BookingBar.displayName = "BookingBar";

function TodayViewComponent({
  title = "Today's Schedule",
  showDatePicker = false,
  roomsToShow,
}: TodayViewProps) {
  const { todaysBookings, isLoading } = useBookings();
  const { rooms: allRooms } = useRooms();

  const rooms = roomsToShow || allRooms;

  const bookingsByRoom = useMemo(() => {
    return rooms.map((room: Room) => ({
      ...room,
      bookings: todaysBookings.filter((b) => b.roomName === room.name),
    }));
  }, [rooms, todaysBookings]);

  return (
    <Card className="animate-fade-in-up">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="grid" style={{ gridTemplateColumns: "160px 1fr" }}>
            {/* Sticky Room Header */}
            <div className="sticky left-0 z-20">
              <div className="p-2 font-medium text-sm border-b border-r bg-muted/30 h-10 flex items-center">
                Conference Room
              </div>
              {isLoading
                ? Array.from({ length: rooms.length || 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-2 font-medium border-b border-r text-sm flex items-center h-12"
                    >
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))
                : bookingsByRoom.map((room: Room) => (
                    <div
                      key={room.id}
                      className="p-2 font-medium border-b border-r text-sm flex items-center h-12"
                    >
                      {room.name}
                    </div>
                  ))}
            </div>

            {/* Scrollable Timeline */}
            <div>
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${hours.length}, minmax(80px, 1fr))`,
                }}
              >
                {hours.map((hour, index) => (
                  <div
                    key={hour}
                    className={cn(
                      "p-2 text-center text-xs font-medium border-b border-r text-muted-foreground bg-muted/30 h-10 flex items-center justify-center",
                      index === hours.length - 1 && "border-r-0"
                    )}
                  >
                    {format(
                      set(new Date(), { hours: hour }),
                      "h a"
                    ).toUpperCase()}
                  </div>
                ))}
              </div>
              {isLoading ? (
                Array.from({ length: rooms.length || 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid h-12"
                    style={{
                      gridTemplateColumns: `repeat(${hours.length}, minmax(80px, 1fr))`,
                    }}
                  >
                    {hours.map((hour, index) => (
                      <div
                        key={hour}
                        className={cn(
                          "border-b border-r h-12",
                          index === hours.length - 1 && "border-r-0"
                        )}
                      ></div>
                    ))}
                  </div>
                ))
              ) : (
                <TooltipProvider>
                  {bookingsByRoom.map(
                    (room: { bookings: Booking[] } & Room) => (
                      <div key={room.id} className="relative h-12 border-b">
                        <div
                          className="grid h-full"
                          style={{
                            gridTemplateColumns: `repeat(${hours.length}, minmax(80px, 1fr))`,
                          }}
                        >
                          {hours.map((hour, index) => (
                            <div
                              key={hour}
                              className={cn(
                                "border-r h-12",
                                index === hours.length - 1 && "border-r-0"
                              )}
                            ></div>
                          ))}
                        </div>
                        {room.bookings.map((booking: Booking) => (
                          <BookingBar key={booking.id} booking={booking} />
                        ))}
                      </div>
                    )
                  )}
                </TooltipProvider>
              )}
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export const TodayView = React.memo(TodayViewComponent);
