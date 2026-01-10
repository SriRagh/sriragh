"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Building, Calendar } from "lucide-react";
import { useBookings } from "@/context/booking-context";
import { useRooms } from "@/context/room-context";
import type { Room, Booking } from "@/lib/types";
import { format, getYear, getMonth, set } from "date-fns";
import * as XLSX from "xlsx";
import { Skeleton } from "@/components/ui/skeleton";

const BookingHistoryTable = ({
  bookings,
  isLoading,
}: {
  bookings: Booking[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="border-t p-4">
        <div className="space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border-t">
        <p className="text-muted-foreground">
          No bookings found for the selected criteria.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="w-full">
      <div className="border-t">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Meeting Title</TableHead>
              <TableHead>Booked By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>{booking.title}</TableCell>
                <TableCell className="font-medium">
                  {booking.bookedBy}
                </TableCell>
                <TableCell>{format(booking.startTime, "PPP")}</TableCell>
                <TableCell>
                  {format(booking.startTime, "p")} -{" "}
                  {format(booking.endTime, "p")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
};

export default function ReportsPage() {
  const { rooms, isLoading: loadingRooms } = useRooms();
  const { bookings, isLoading: loadingBookings } = useBookings();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(new Date().getMonth())
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    String(new Date().getFullYear())
  );

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  }, []);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: String(i),
      label: format(set(new Date(), { month: i }), "MMMM"),
    }));
  }, []);

  const selectedRoom = useMemo(() => {
    return rooms.find((r) => String(r.id) === selectedRoomId) || null;
  }, [rooms, selectedRoomId]);

  const roomBookings = useMemo(() => {
    if (!selectedRoomId) return [];

    const month = parseInt(selectedMonth);
    const year = parseInt(selectedYear);

    return bookings
      .filter(
        (b) =>
          String(b.roomId) === selectedRoomId &&
          getMonth(b.startTime) === month &&
          getYear(b.startTime) === year
      )
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [bookings, selectedRoomId, selectedMonth, selectedYear]);

  const handleExport = () => {
    if (!selectedRoom || roomBookings.length === 0) return;

    const dataToExport = roomBookings.map((b) => ({
      "Room Name": b.roomName,
      "Meeting Title": b.title,
      "Booked By": b.bookedBy,
      Date: format(b.startTime, "yyyy-MM-dd"),
      "Start Time": format(b.startTime, "HH:mm"),
      "End Time": format(b.endTime, "HH:mm"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");

    XLSX.writeFile(
      workbook,
      `${selectedRoom.name}_booking_history_${
        months[parseInt(selectedMonth)].label
      }_${selectedYear}.xlsx`
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Room Booking Reports
        </h1>
        <p className="text-lg text-muted-foreground">
          View and export booking history for conference rooms.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Room Booking History</CardTitle>
          <CardDescription>
            Select a room and month to view its complete booking history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            <div className="w-full sm:w-auto sm:min-w-64">
              <Select
                onValueChange={setSelectedRoomId}
                value={selectedRoomId || ""}
              >
                <SelectTrigger>
                  <Building className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select a room..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingRooms ? (
                    <SelectItem value="loading" disabled>
                      Loading rooms...
                    </SelectItem>
                  ) : rooms.length > 0 ? (
                    rooms.map((room: Room) => (
                      <SelectItem key={room.id} value={String(room.id)}>
                        {room.name} ({room.location})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-rooms" disabled>
                      No rooms available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4">
              <div className="w-full sm:w-auto">
                <Select onValueChange={setSelectedMonth} value={selectedMonth}>
                  <SelectTrigger>
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-auto">
                <Select onValueChange={setSelectedYear} value={selectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleExport}
              disabled={!selectedRoomId || roomBookings.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </CardContent>
        <BookingHistoryTable
          bookings={roomBookings}
          isLoading={loadingBookings || (loadingRooms && !selectedRoomId)}
        />
        <CardFooter className="pt-6">
          {selectedRoom && (
            <p className="text-sm text-muted-foreground">
              {roomBookings.length} booking(s) found for {selectedRoom.name} in{" "}
              {months[parseInt(selectedMonth)].label} {selectedYear}.
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
