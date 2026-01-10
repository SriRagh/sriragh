"use client";

import React, { useMemo } from "react";
import { useBookings } from "@/context/booking-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  format,
  formatDistanceToNow,
  isWithinInterval,
  isPast,
} from "date-fns";
import { BookOpenCheck, Calendar, Clock, Briefcase } from "lucide-react";
import type { Booking } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MonthlyCalendarView } from "@/components/monthly-calendar-view";
import { TodayView } from "@/components/today-view";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const BookingInfoCard = ({ booking }: { booking: Booking }) => {
  const now = new Date();
  const isOngoing = isWithinInterval(now, {
    start: booking.startTime,
    end: booking.endTime,
  });
  const isCompleted = isPast(booking.endTime);
  const isUpcoming = !isOngoing && !isCompleted;

  const getStatus = () => {
    if (isOngoing)
      return {
        text: "Ongoing",
        variant: "destructive" as const,
        className: "bg-blue-500",
      };
    if (isCompleted)
      return { text: "Completed", variant: "outline" as const, className: "" };
    return { text: "Upcoming", variant: "default" as const, className: "" };
  };

  const status = getStatus();

  return (
    <Card className="w-full animate-fade-in-up">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold text-primary">
              {booking.roomName}
            </p>
            <h3 className="text-lg font-bold">{booking.title}</h3>
            <p className="text-sm text-muted-foreground">
              {format(booking.startTime, "PPP")}
            </p>
          </div>
          <Badge variant={status.variant} className={cn(status.className)}>
            {status.text}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>
              {format(booking.startTime, "p")} - {format(booking.endTime, "p")}
            </span>
          </div>
          {isUpcoming && (
            <span className="font-medium">
              {formatDistanceToNow(booking.startTime, { addSuffix: true })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const UpcomingMeetings = () => {
  const { myUpcomingBookings = [], myTodaysBookings = [] } = useBookings();

  const userUpcomingBookings = useMemo(
    () =>
      [...myTodaysBookings, ...myUpcomingBookings]
        .filter((b) => !isPast(b.endTime))
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [myTodaysBookings, myUpcomingBookings]
  );

  return (
    <div className="space-y-4">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Upcoming & Ongoing</CardTitle>
            <CardDescription>
              Here are your next scheduled room bookings.
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/bookings">Book a Room</Link>
          </Button>
        </div>
      </CardHeader>
      {userUpcomingBookings.length > 0 ? (
        <div className="space-y-4">
          {userUpcomingBookings.slice(0, 2).map((booking: Booking) => (
            <BookingInfoCard key={booking.id} booking={booking} />
          ))}
        </div>
      ) : (
        <Card className="flex items-center justify-center h-24 border-dashed">
          <p className="text-muted-foreground">
            You have no upcoming bookings.
          </p>
        </Card>
      )}
    </div>
  );
};

const PastMeetings = () => {
  const { myPastBookings = [] } = useBookings();

  return (
    <div className="space-y-4">
      <CardHeader className="p-0">
        <div>
          <CardTitle>Past Meetings</CardTitle>
          <CardDescription>Review your past room reservations.</CardDescription>
        </div>
      </CardHeader>
      {myPastBookings.length > 0 ? (
        <div className="space-y-4">
          {myPastBookings.slice(0, 2).map((booking: Booking) => (
            <BookingInfoCard key={booking.id} booking={booking} />
          ))}
        </div>
      ) : (
        <Card className="flex items-center justify-center h-24 border-dashed">
          <p className="text-muted-foreground">You have no past bookings.</p>
        </Card>
      )}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    myUpcomingBookings = [],
    myPastBookings = [],
    myTodaysBookings = [],
    myOngoingBookings = [],
    isLoading,
  } = useBookings();

  const totalUserBookings =
    myUpcomingBookings.length + myPastBookings.length + myTodaysBookings.length;

  if (isLoading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight animate-fade-in-down">
          Welcome back, {user?.firstName}!
        </h1>
        <p
          className="text-lg text-muted-foreground animate-fade-in-down"
          style={{ animationDelay: "0.1s", animationFillMode: "both" }}
        >
          Here's a Summary of Your Room Booking Activity
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUserBookings}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Bookings
            </CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myUpcomingBookings.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ongoing</CardTitle>
            <Calendar className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myOngoingBookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Bookings
            </CardTitle>
            <BookOpenCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myPastBookings.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <TodayView title="Today's Schedule" showDatePicker={true} />
      </div>

      <div className="space-y-6">
        <MonthlyCalendarView title="All Bookings Calendar" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <UpcomingMeetings />
          <PastMeetings />
        </div>
      </div>
    </div>
  );
}
