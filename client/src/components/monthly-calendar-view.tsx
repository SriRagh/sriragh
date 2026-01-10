"use client";

import React, { useState, useMemo } from "react";
import type { Booking } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
  startOfDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBookings } from "@/context/booking-context";
import { Skeleton } from "./ui/skeleton";

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

function MonthlyCalendarViewComponent({
  title = "Bookings Calendar",
}: {
  title?: string;
}) {
  const { bookings, isLoading, setViewDate } = useBookings();
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));

  const handleMonthChange = (months: number) => {
    const newDate = addMonths(currentDate, months);
    setCurrentDate(newDate);
    setViewDate(newDate);
  };

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(firstDayOfMonth),
    end: endOfWeek(lastDayOfMonth),
  });

  const bookingsForMonth = useMemo(() => {
    const start = startOfWeek(firstDayOfMonth);
    const end = endOfWeek(lastDayOfMonth);
    return bookings.filter((b) => b.startTime >= start && b.startTime <= end);
  }, [bookings, firstDayOfMonth, lastDayOfMonth]);

  return (
    <Card className="lg:col-span-2 animate-fade-in-up">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleMonthChange(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-center w-32">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleMonthChange(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-7 border-t border-l">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-20 p-1.5 border-r border-b relative">
                <Skeleton className="h-4 w-4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
              </div>
            ))}
          </div>
        ) : (
          <TooltipProvider>
            <div className="grid grid-cols-7">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-xs font-semibold text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 border-l border-t">
              {daysInMonth.map((day) => {
                const dayBookings = bookingsForMonth
                  .filter((b) => isSameDay(b.startTime, day))
                  .sort(
                    (a, b) => a.startTime.getTime() - b.startTime.getTime()
                  );
                const visibleBookings = dayBookings.slice(0, 1);
                const hiddenBookingsCount =
                  dayBookings.length - visibleBookings.length;

                return (
                  <div
                    key={day.toString()}
                    className={cn(
                      "h-20 p-1.5 border-r border-b relative overflow-y-auto",
                      !isSameMonth(day, currentDate) &&
                        "bg-muted/30 text-muted-foreground/50"
                    )}
                  >
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isToday(day) &&
                          "flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="mt-1 space-y-1">
                      {visibleBookings.map((booking) => (
                        <Tooltip key={booking.id} delayDuration={100}>
                          <TooltipTrigger asChild>
                            <div className="w-full flex items-center p-0.5 rounded-sm bg-opacity-20 cursor-pointer">
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full mr-1.5 flex-shrink-0",
                                  roomDotColors[booking.roomName] ||
                                    "bg-gray-400"
                                )}
                              ></span>
                              <p className="text-xs truncate text-foreground/80">
                                {booking.title}
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-bold">{booking.title}</p>
                            <p>{booking.roomName}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(booking.startTime, "p")} -{" "}
                              {format(booking.endTime, "p")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {hiddenBookingsCount > 0 && (
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <div className="w-full flex items-center p-0.5 rounded-sm cursor-pointer">
                              <p className="text-xs font-medium text-muted-foreground">
                                +{hiddenBookingsCount} more
                              </p>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {dayBookings.slice(1).map((b) => (
                              <div key={b.id} className="py-1">
                                <p className="font-bold">{b.title}</p>
                                <p className="text-sm">{b.roomName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(b.startTime, "p")} -{" "}
                                  {format(b.endTime, "p")}
                                </p>
                              </div>
                            ))}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}

export const MonthlyCalendarView = React.memo(MonthlyCalendarViewComponent);
