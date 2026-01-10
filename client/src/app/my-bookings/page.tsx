
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useBookings } from "@/context/booking-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isPast, isWithinInterval, formatDistanceToNow } from "date-fns";
import { Trash2, Pencil, CalendarOff, Clock } from "lucide-react";
import type { Booking } from "@/lib/types";
import { CancelBookingDialog } from "@/components/cancel-booking-dialog";
import { UpdateBookingDialog } from "@/components/update-booking-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const BookingCard = ({ booking, onCancel, onUpdate }: { booking: Booking; onCancel: (bookingId: number) => void; onUpdate: () => void; }) => {
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  const now = new Date();
  const isOngoing = isWithinInterval(now, { start: booking.startTime, end: booking.endTime });
  const isCompleted = isPast(booking.endTime);
  const isUpcoming = !isOngoing && !isCompleted;

  const getStatus = () => {
    if (isOngoing) return { text: 'Ongoing', variant: 'destructive' as const, className: 'bg-blue-500' };
    if (isCompleted) return { text: 'Completed', variant: 'outline' as const, className: '' };
    return { text: 'Upcoming', variant: 'default' as const, className: '' };
  };

  const status = getStatus();

  const handleUpdateConfirm = () => {
    onUpdate();
    setIsUpdateDialogOpen(false);
  };

  return (
    <>
      <Card className="w-full animate-fade-in-up">
        <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
                <p className="text-sm font-semibold text-primary">{booking.roomName}</p>
                <Badge variant={status.variant} className={cn(status.className, "ml-2")}>{status.text}</Badge>
            </div>
            <h3 className="text-lg font-bold">{booking.title}</h3>
            <p className="text-sm text-muted-foreground">{format(booking.startTime, 'PPP')}</p>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <Clock className="w-4 h-4 mr-1.5" />
              <span>{format(booking.startTime, 'p')} - {format(booking.endTime, 'p')}</span>
               {isUpcoming && <span className="font-medium ml-2 text-foreground/80">({formatDistanceToNow(booking.startTime, { addSuffix: true })})</span>}
            </div>
          </div>
          {!isCompleted && (
            <div className="flex items-center gap-2 pt-2 sm:pt-0 shrink-0 self-start sm:self-center">
              <Button variant="outline" size="sm" onClick={() => setIsUpdateDialogOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Update
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setIsCancelDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {booking.id && (
        <>
          <CancelBookingDialog
            booking={booking}
            isOpen={isCancelDialogOpen}
            onOpenChange={setIsCancelDialogOpen}
            onConfirmCancel={() => onCancel(booking.id!)}
          />
          {isUpdateDialogOpen && (
            <UpdateBookingDialog
              booking={booking}
              isOpen={isUpdateDialogOpen}
              onOpenChange={setIsUpdateDialogOpen}
              onConfirmUpdate={handleUpdateConfirm}
            />
          )}
        </>
      )}
    </>
  );
};


const BookingsList = ({ bookings, isLoading, onCancelBooking, onUpdateBooking, emptyMessage }: { bookings: Booking[]; isLoading: boolean; onCancelBooking: (bookingId: number) => void; onUpdateBooking: () => void; emptyMessage: string; }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center h-48 border-dashed animate-fade-in-up">
        <CalendarOff className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">No Bookings</h3>
        <p className="text-muted-foreground text-center">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          onCancel={onCancelBooking}
          onUpdate={onUpdateBooking}
        />
      ))}
    </div>
  );
};

export default function MyBookingsPage() {
  const { user } = useAuth();
  const { myBookings, isLoading, cancelBooking, fetchMyBookings } = useBookings();
  
  useEffect(() => {
    if (user?.id && fetchMyBookings) {
      fetchMyBookings(user.id);
    }
  }, [user, fetchMyBookings]);

  const handleUpdateBooking = () => {
    if (user) {
      fetchMyBookings(user.id);
    }
  };

  const upcomingAndToday = useMemo(() => 
    [...myBookings]
      .filter(b => !isPast(b.endTime))
      .sort((a,b) => a.startTime.getTime() - b.startTime.getTime()),
    [myBookings]
  );

  const past = useMemo(() =>
    [...myBookings]
        .filter(b => isPast(b.endTime))
        .sort((a,b) => b.startTime.getTime() - a.startTime.getTime()),
    [myBookings]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
        <p className="text-lg text-muted-foreground">View and manage all your room reservations.</p>
      </div>

      <div className="space-y-8">
        <section>
          <CardHeader className="px-0 pt-0">
            <CardTitle>Upcoming & Ongoing</CardTitle>
            <CardDescription>All your future and currently active bookings.</CardDescription>
          </CardHeader>
          <BookingsList
            bookings={upcomingAndToday}
            isLoading={isLoading}
            onCancelBooking={cancelBooking}
            onUpdateBooking={handleUpdateBooking}
            emptyMessage="You have no upcoming bookings."
          />
        </section>

        <section>
          <CardHeader className="px-0 pt-0">
            <CardTitle>Past Meetings</CardTitle>
            <CardDescription>A history of your completed bookings.</CardDescription>
          </CardHeader>
          <BookingsList
            bookings={past}
            isLoading={isLoading}
            onCancelBooking={cancelBooking}
            onUpdateBooking={handleUpdateBooking}
            emptyMessage="You have no past bookings."
          />
        </section>
      </div>
    </div>
  );
}
