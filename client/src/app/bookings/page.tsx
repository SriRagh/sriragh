"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Users,
  Projector,
  Presentation,
  Tv,
  Utensils,
  Check,
  MapPin,
  Clock,
  Wrench,
} from "lucide-react";
import type { Room } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useBookings } from "@/context/booking-context";
import {
  set,
  isSameDay,
  format,
  startOfDay,
  isBefore,
  addMinutes,
  isAfter,
  parse,
} from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// import { Calendar } from '@/components/ui/calendar';
import Image from "next/image";
import { timeSlots } from "@/lib/slots";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { ConfirmBookingDialog } from "@/components/confirm-booking-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRooms } from "@/context/room-context";
import { Input } from "@/components/ui/input";

export const parseTimeString = (time: string, date: Date): Date => {
  const [hours, minutes] = time.split(":").map(Number);
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

const AmenityIcon = ({ amenity }: { amenity: string }) => {
  switch (amenity) {
    case "Projector":
      return <Projector className="h-4 w-4" />;
    case "Whiteboard":
      return <Presentation className="h-4 w-4" />;
    case "Video Conferencing":
      return <Tv className="h-4 w-4" />;
    case "Catering":
      return <Utensils className="h-4 w-4" />;
    default:
      return <Check className="h-4 w-4" />;
  }
};

const RoomCard = ({
  room,
  index,
  onBookSlot,
  selectedDate,
  availableSlots,
}: {
  room: Room;
  index: number;
  onBookSlot: (room: Room, startTime: Date, endTime: Date) => void;
  selectedDate: Date;
  availableSlots: Record<number, string[]>;
}) => {
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(
    null
  );
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // Default duration 60 mins
  const { toast } = useToast();

  const getAiHint = (roomName: string) => {
    switch (roomName.toLowerCase()) {
      case "vayu":
        return "small meeting";
      case "prithvi":
        return "team collaboration";
      case "jal":
        return "formal presentation";
      case "akash":
        return "creative brainstorm";
      case "haleakala":
        return "private discussion";
      case "pali":
        return "large conference";
      default:
        return "meeting room";
    }
  };

  const handleBooking = () => {
    if (selectedStartTime) {
      const startTime = parseTimeString(selectedStartTime, selectedDate);
      const endTime = addMinutes(startTime, selectedDuration);

      // We perform a final check here, though availability is pre-calculated
      if (!availableSlots[selectedDuration]?.includes(selectedStartTime)) {
        toast({
          title: "Booking Conflict",
          description:
            "This time slot is no longer available. Please select another time.",
          variant: "destructive",
        });
        setSelectedStartTime(null);
        return;
      }
      onBookSlot(room, startTime, endTime);
    }
  };

  const currentAvailableStartTimes = availableSlots[selectedDuration] || [];

  // Reset selected start time if it becomes unavailable
  useEffect(() => {
    if (
      selectedStartTime &&
      !currentAvailableStartTimes.includes(selectedStartTime)
    ) {
      setSelectedStartTime(null);
    }
  }, [selectedDuration, currentAvailableStartTimes, selectedStartTime]);

  return (
    <Card
      className="grid md:grid-cols-3 overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "both" }}
    >
      <div className="relative aspect-video md:aspect-auto">
        <Image
          src={room.image}
          alt={room.name}
          fill
          className="object-cover"
          data-ai-hint={getAiHint(room.name)}
          priority={index < 2}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="flex flex-col md:col-span-2">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{room.name}</CardTitle>
          <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{room.capacity} People</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{room.location}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-2">
            {room.amenities.map((amenity) => (
              <Badge
                key={amenity}
                variant="outline"
                className="flex items-center gap-1.5 py-1 px-2 text-xs"
              >
                <AmenityIcon amenity={amenity} />
                {amenity}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">
              Book a slot for {format(selectedDate, "PPP")}
            </h4>
            {room.maintenance ? (
              <div className="flex items-center gap-2 rounded-md border border-dashed border-orange-500 bg-orange-50 dark:bg-orange-950 p-4">
                <Wrench className="h-6 w-6 text-orange-500" />
                <div>
                  <p className="font-semibold text-orange-600 dark:text-orange-400">
                    Under Maintenance
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This room is temporarily unavailable for booking.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 w-full sm:w-auto">
                  <Select
                    onValueChange={(value) =>
                      setSelectedDuration(parseInt(value))
                    }
                    defaultValue="60"
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
                </div>

                <div className="flex-1 w-full sm:w-auto">
                  <Select
                    value={selectedStartTime || ""}
                    onValueChange={setSelectedStartTime}
                  >
                    <SelectTrigger
                      disabled={currentAvailableStartTimes.length === 0}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Select a start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentAvailableStartTimes.length > 0 ? (
                        currentAvailableStartTimes.map((slot) => (
                          <SelectItem key={slot} value={slot}>
                            {format(parseTimeString(slot, new Date()), "p")}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-4 text-sm text-muted-foreground">
                          No available slots for this duration.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleBooking}
                  disabled={!selectedStartTime}
                  className="w-full sm:w-auto"
                >
                  Book
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

type SelectedBooking = {
  room: Room;
  startTime: Date;
  endTime: Date;
};

export default function BookingsPage() {
  const { rooms, locations } = useRooms();
  const { bookings, addBooking, setViewDate } = useBookings();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] =
    useState<SelectedBooking | null>(null);
  const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("All");

  const filteredRooms = useMemo(() => {
    const activeRooms = rooms.filter((room) => room.status === "Active");
    if (selectedLocation === "All") {
      return activeRooms;
    }
    return activeRooms.filter((room) => room.location === selectedLocation);
  }, [selectedLocation, rooms]);

  const bookingsForDate = useMemo(() => {
    return bookings.filter((booking) =>
      isSameDay(booking.startTime, currentDate)
    );
  }, [bookings, currentDate]);

  const roomAvailability = useMemo(() => {
    const availability: Record<number, Record<number, string[]>> = {};

    const roomBookingsMap = new Map<number, { start: number; end: number }[]>();
    for (const booking of bookingsForDate) {
      if (!roomBookingsMap.has(booking.roomId)) {
        roomBookingsMap.set(booking.roomId, []);
      }
      roomBookingsMap.get(booking.roomId)!.push({
        start: booking.startTime.getTime(),
        end: booking.endTime.getTime(),
      });
    }

    for (const room of filteredRooms) {
      if (room.maintenance) {
        availability[room.id] = { 30: [], 60: [], 90: [] };
        continue;
      }

      availability[room.id] = {};
      const roomBookings = roomBookingsMap.get(room.id) || [];

      const isSlotOverlapping = (
        slotStartTime: number,
        slotEndTime: number
      ) => {
        for (const booking of roomBookings) {
          if (slotStartTime < booking.end && slotEndTime > booking.start) {
            return true;
          }
        }
        return false;
      };

      const durations = [30, 60, 90];
      const now = new Date();
      const isToday = isSameDay(currentDate, now);

      for (const duration of durations) {
        availability[room.id][duration] = timeSlots.filter((slot) => {
          const slotStartTime = parseTimeString(slot, currentDate);
          if (isToday && isBefore(slotStartTime, now)) {
            return false;
          }
          const slotEndTime = addMinutes(slotStartTime, duration);
          return !isSlotOverlapping(
            slotStartTime.getTime(),
            slotEndTime.getTime()
          );
        });
      }
    }
    return availability;
  }, [filteredRooms, bookingsForDate, currentDate]);

  const handleBookSlot = (room: Room, startTime: Date, endTime: Date) => {
    if (!user) {
      toast({
        title: "Cannot book room",
        description: "Please ensure you are logged in.",
        variant: "destructive",
      });
      return;
    }
    setSelectedBooking({ room, startTime, endTime });
  };

  const handleConfirmBooking = async (title: string) => {
    if (!selectedBooking || !user) return;

    const { room, startTime, endTime } = selectedBooking;

    try {
      await addBooking({
        roomId: room.id,
        title: title,
        bookedBy: user.username,
        startTime,
        endTime,
        requirements: "None",
        location: room.location,
      });

      toast({
        title: "Booking Confirmed!",
        description: `${room.name} has been booked for ${format(
          startTime,
          "PPP p"
        )}.`,
      });
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }

    setSelectedBooking(null);
  };

  const handleDateSelect = (date: string | undefined) => {
    if (date) {
      const newDate = startOfDay(parse(date, "yyyy-MM-dd", new Date()));
      setCurrentDate(newDate);
      setViewDate(newDate);
    }
    setIsDatePickerOpen(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight mb-1 animate-fade-in-down">
          Book a Conference Room
        </h1>
        <p
          className="text-lg text-muted-foreground animate-fade-in-down"
          style={{ animationDelay: "0.1s", animationFillMode: "both" }}
        >
          Find and reserve the perfect space for your next meeting.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Find Available Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative w-full sm:w-[280px]">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={format(currentDate, "yyyy-MM-dd")}
                onChange={(e) => handleDateSelect(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
                className="pl-10"
              />
            </div>

            <Select
              value={selectedLocation}
              onValueChange={setSelectedLocation}
            >
              <SelectTrigger className="w-full sm:w-[280px]">
                <MapPin className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        {filteredRooms.length > 0 ? (
          filteredRooms.map((room, index) => (
            <RoomCard
              key={room.id}
              room={room}
              index={index}
              onBookSlot={handleBookSlot}
              selectedDate={currentDate}
              availableSlots={roomAvailability[room.id] || {}}
            />
          ))
        ) : (
          <Card className="flex items-center justify-center h-48 border-dashed">
            <p className="text-muted-foreground">
              No active rooms found for the selected location.
            </p>
          </Card>
        )}
      </div>
      {selectedBooking && (
        <ConfirmBookingDialog
          isOpen={!!selectedBooking}
          onOpenChange={() => setSelectedBooking(null)}
          room={selectedBooking.room}
          startTime={selectedBooking.startTime}
          endTime={selectedBooking.endTime}
          onConfirm={handleConfirmBooking}
        />
      )}
    </div>
  );
}
