
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Room } from '@/lib/types';
import { format } from 'date-fns';
import { Label } from './ui/label';

interface ConfirmBookingDialogProps {
  room: Room;
  startTime: Date;
  endTime: Date;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: (title: string) => void;
}

export function ConfirmBookingDialog({ room, startTime, endTime, isOpen, onOpenChange, onConfirm }: ConfirmBookingDialogProps) {
  const [title, setTitle] = useState('');

  const handleConfirm = () => {
    onConfirm(title || `Booking for ${room.name}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Your Booking</DialogTitle>
          <DialogDescription>
            You are about to book the following conference room.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div>
                <p className="font-semibold text-lg">{room.name}</p>
                <p className="text-muted-foreground">{format(startTime, 'PPP')}</p>
                <p className="text-muted-foreground">{format(startTime, 'p')} - {format(endTime, 'p')}</p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="title">Meeting Title</Label>
                <Input
                    id="title"
                    placeholder="e.g., Project Kickoff, Team Sync..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm}>
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    