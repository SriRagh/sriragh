"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useBookings } from "@/context/booking-context";
import type { Booking, UpdateBookingPayload } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { useRooms } from "@/context/room-context";
import { timeSlots } from "@/lib/slots";
import {
  addMinutes,
  format,
  isBefore,
  isSameDay,
  startOfDay,
  set,
  parse,
} from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
// import { Calendar } from './ui/calendar';
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { parseTimeString } from "@/app/bookings/page";

const updateBookingSchema = z.object({
  bookingTitle: z.string().min(1, "Meeting title is required"),
  date: z.date(),
  startTime: z.string().min(1, "Start time is required"),
  duration: z.number().min(30),
});

type UpdateBookingFormValues = z.infer<typeof updateBookingSchema>;

interface UpdateBookingDialogProps {
  booking: Booking;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirmUpdate: () => void;
}

export function UpdateBookingDialog({
  booking,
  isOpen,
  onOpenChange,
  onConfirmUpdate,
}: UpdateBookingDialogProps) {
  const { user } = useAuth();
  const { bookings, updateBooking } = useBookings();
  const { rooms } = useRooms();
  const { toast } = useToast();

  const form = useForm<UpdateBookingFormValues>({
    resolver: zodResolver(updateBookingSchema),
    defaultValues: {
      bookingTitle: booking.title,
      date: startOfDay(booking.startTime),
      startTime: format(booking.startTime, "HH:mm"),
      duration: Math.max(
        30,
        (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60)
      ),
    },
  });

  const selectedDate = form.watch("date");
  const selectedDuration = form.watch("duration");
  const selectedStartTimeValue = form.watch("startTime");

  const bookingsForRoomOnDate = useMemo(() => {
    if (!selectedDate) return [];
    return bookings.filter(
      (b) =>
        b.roomId === booking.roomId &&
        isSameDay(b.startTime, selectedDate) &&
        b.id !== booking.id // Exclude the current booking being edited
    );
  }, [bookings, booking.id, booking.roomId, selectedDate]);

  const isSlotOverlapping = (slotStartTime: Date, slotEndTime: Date) => {
    for (const b of bookingsForRoomOnDate) {
      if (slotStartTime < b.endTime && slotEndTime > b.startTime) {
        return true;
      }
    }
    return false;
  };

  const availableStartTimes = useMemo(() => {
    if (!selectedDate) return [];
    const now = new Date();
    const isToday = isSameDay(selectedDate, now);

    return timeSlots.filter((slot) => {
      const slotStartTime = parseTimeString(slot, selectedDate);

      if (isToday && isBefore(slotStartTime, now)) {
        return false;
      }

      const slotEndTime = addMinutes(slotStartTime, selectedDuration);
      return !isSlotOverlapping(slotStartTime, slotEndTime);
    });
  }, [
    selectedDate,
    selectedDuration,
    bookingsForRoomOnDate,
    isSlotOverlapping,
  ]);

  useEffect(() => {
    if (
      selectedStartTimeValue &&
      !availableStartTimes.find((slot) => slot === selectedStartTimeValue)
    ) {
      form.setValue("startTime", "");
    }
  }, [availableStartTimes, selectedStartTimeValue, form]);

  const onSubmit = async (data: UpdateBookingFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to update a booking.",
        variant: "destructive",
      });
      return;
    }

    try {
      const room = rooms.find((r) => r.id === booking.roomId);
      if (!room) {
        toast({
          title: "Error",
          description: "Could not find room details.",
          variant: "destructive",
        });
        return;
      }

      const newStartTime = parseTimeString(data.startTime, data.date);
      const newEndTime = addMinutes(newStartTime, data.duration);

      if (isSlotOverlapping(newStartTime, newEndTime)) {
        toast({
          title: "Booking Conflict",
          description:
            "This time slot is no longer available. Please select another time.",
          variant: "destructive",
        });
        return;
      }

      const timeZone =
        room.location === "Hyderabad" ? "Asia/Kolkata" : "Pacific/Honolulu";

      const startTimeString = format(newStartTime, "MM/dd/yyyy hh:mm:ss a");
      const endTimeString = format(newEndTime, "MM/dd/yyyy hh:mm:ss a");

      const payload: UpdateBookingPayload = {
        userId: Number(user.id),
        roomId: booking.roomId,
        bookingTitle: data.bookingTitle,
        updatedBy: user.username,
        location: room.location,
        startTime: startTimeString,
        endTime: endTimeString,
        timeZone: timeZone,
      };

      await updateBooking(booking.id, payload);
      onConfirmUpdate();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Booking</DialogTitle>
          <DialogDescription>
            Update the details for your meeting in {booking.roomName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bookingTitle">Meeting Title</Label>
            <Input id="bookingTitle" {...form.register("bookingTitle")} />
            {form.formState.errors.bookingTitle && (
              <p className="text-sm text-destructive">
                {form.formState.errors.bookingTitle.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Controller
              control={form.control}
              name="date"
              render={({ field }) => (
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={format(field.value, "yyyy-MM-dd")}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value
                          ? startOfDay(
                              parse(e.target.value, "yyyy-MM-dd", new Date())
                            )
                          : undefined
                      )
                    }
                    min={format(new Date(), "yyyy-MM-dd")}
                    className="pl-10"
                  />
                </div>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Controller
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger disabled={availableStartTimes.length === 0}>
                      <Clock className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Select a start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStartTimes.length > 0 ? (
                        availableStartTimes.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {format(parseTimeString(slot, new Date()), "p")}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-sm text-muted-foreground">
                          No available slots.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.startTime && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.startTime.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Controller
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={String(field.value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Updating..." : "Update Booking"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
