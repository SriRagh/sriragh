
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Booking } from '@/lib/types';

interface CancelBookingDialogProps {
  booking: Booking;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirmCancel: (bookingId: number | null) => void;
}

export function CancelBookingDialog({ booking, isOpen, onOpenChange, onConfirmCancel }: CancelBookingDialogProps) {

  const handleCancel = () => {
    onConfirmCancel(booking.id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently cancel your booking for "{booking.title}" in {booking.roomName}. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Booking</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancel}>
            Yes, Cancel Booking
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
