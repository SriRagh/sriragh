
"use client";

import React, { useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { add, format, set, isSameDay, isBefore, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameMonth, startOfDay } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useBookings } from '@/context/booking-context';
import { Check, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Room, Booking } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/auth-context';

const timeSlots = [
    '08:00am - 12:30pm',
    '12:30pm - 05:30pm',
];

const formSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  timeSlot: z.string({ required_error: "A time slot is required." }),
});

interface BookingFormProps {
  room: Room;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function BookingForm({ room, isOpen, onOpenChange }: BookingFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { bookings, addBooking } = useBookings();
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { date: new Date() },
  });

  const selectedDate = form.watch('date');
  const selectedTimeSlot = form.watch('timeSlot');

  const roomBookingsForDay = useMemo(() => {
    return bookings.filter(b => b.roomId === room.id && isSameDay(b.startTime, selectedDate));
  }, [bookings, room.id, selectedDate]);

  const parseTimeSlot = (slot: string, date: Date) => {
    const [start, end] = slot.split(' - ');
    const parseTime = (timeStr: string) => {
        const [hour, minute] = timeStr.slice(0, -2).split(':');
        let hours = parseInt(hour);
        if (timeStr.includes('pm') && hours < 12) hours += 12;
        if (timeStr.includes('am') && hours === 12) hours = 0;
        return set(date, { hours, minutes: parseInt(minute || '0') });
    };

    const startTime = parseTime(start);
    const endTime = parseTime(end);
    return { startTime, endTime };
  }

  const getSlotInfo = (slot: string): { isBooked: boolean, isPast: boolean, bookingDetails: Booking | null } => {
    if (!selectedDate) return { isBooked: false, isPast: false, bookingDetails: null };
    
    const { startTime: slotStartTime, endTime: slotEndTime } = parseTimeSlot(slot, selectedDate);
    
    const isPast = isBefore(slotEndTime, new Date());

    for (const booking of roomBookingsForDay) {
        if (
            (booking.startTime < slotEndTime) && (booking.endTime > slotStartTime)
        ) {
            return { isBooked: true, isPast, bookingDetails: booking };
        }
    }
    return { isBooked: false, isPast, bookingDetails: null };
  };

  useEffect(() => {
    if (!isOpen) {
        form.reset({ date: new Date(), timeSlot: undefined });
    }
  }, [isOpen, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const { startTime, endTime } = parseTimeSlot(values.timeSlot, values.date);
    
    const isConflict = bookings.some(booking => 
        booking.roomId === room.id &&
        (startTime < booking.endTime && endTime > booking.startTime)
    );

    if (isConflict) {
        toast({
            title: 'Booking Conflict',
            description: 'This room has already been booked for the selected time. Please choose another slot.',
            variant: 'destructive'
        });
        return;
    }

    addBooking({
      roomId: room.id,
      title: 'New Booking',
      bookedBy: user?.email || 'current_user@example.com',
      startTime,
      endTime,
    });

    toast({
      title: 'Booking Confirmed!',
      description: `${room.name} has been booked for ${format(startTime, 'PPP p')}.`,
    });
    onOpenChange(false);
  }

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const nextMonth = () => setCurrentMonth(add(currentMonth, { months: 1 }));
  const prevMonth = () => setCurrentMonth(add(currentMonth, { months: -1 }));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 flex flex-col">
                <DialogHeader>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative h-20 w-20 rounded-lg overflow-hidden">
                            <Image
                            src={room.image}
                            alt={room.name}
                            fill
                            className="object-cover"
                            />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{room.name}</h2>
                            <p className="text-green-600 flex items-center gap-1 font-semibold">
                                <CheckCircle className="w-4 h-4"/>
                                Available
                            </p>
                        </div>
                        <div className="ml-auto text-center bg-gray-900 text-white rounded-lg p-3">
                            <p className="font-bold text-lg">{format(selectedDate, 'd')}</p>
                            <p className="text-sm">{format(selectedDate, 'MMM')}</p>
                        </div>
                    </div>
                </DialogHeader>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 flex-grow flex flex-col">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" size="icon" onClick={prevMonth} type="button">
                            <ChevronLeft />
                        </Button>
                        <h3 className="font-bold text-lg">{format(currentMonth, 'MMMM yyyy')}</h3>
                        <Button variant="ghost" size="icon" onClick={nextMonth} type="button">
                            <ChevronRight />
                        </Button>
                    </div>

                    <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                            <div className="grid grid-cols-7 gap-2 text-center text-sm text-muted-foreground">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
                            </div>
                            <FormControl>
                                <div className="grid grid-cols-7 gap-2">
                                    {daysInMonth.map(day => (
                                        <Button
                                            key={day.toString()}
                                            type="button"
                                            variant={isSameDay(day, field.value) ? 'default' : 'ghost'}
                                            className={cn(
                                                "h-10 w-10 p-0 rounded-full",
                                                !isSameMonth(day, currentMonth) && "text-muted-foreground opacity-50"
                                            )}
                                            onClick={() => field.onChange(day)}
                                            disabled={isBefore(day, startOfDay(new Date()))}
                                        >
                                            {format(day, 'd')}
                                        </Button>
                                    ))}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={form.control}
                    name="timeSlot"
                    render={({ field }) => (
                        <FormItem className="flex-grow">
                            <h4 className="font-semibold text-muted-foreground mb-2">{timeSlots.length - roomBookingsForDay.length} time slots available</h4>
                            <FormControl>
                                <div className="space-y-3">
                                <TooltipProvider>
                                {timeSlots.map(slot => {
                                    const { isBooked, isPast, bookingDetails } = getSlotInfo(slot);
                                    const isDisabled = isBooked || isPast;

                                    if (isDisabled) {
                                        return (
                                        <Tooltip key={slot} delayDuration={100}>
                                            <TooltipTrigger asChild>
                                            <div className="w-full text-center border rounded-lg py-3 cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-800">
                                                {slot}
                                            </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {isPast && !isBooked && <p>Time has passed</p>}
                                                {isBooked && bookingDetails && <p>Booked by {bookingDetails.bookedBy} for "{bookingDetails.title}"</p>}
                                            </TooltipContent>
                                        </Tooltip>
                                        )
                                    }

                                    return (
                                        <Button
                                        key={slot}
                                        type="button"
                                        variant={field.value === slot ? "default" : "outline"}
                                        className="w-full text-lg py-6"
                                        onClick={() => field.onChange(slot)}
                                        >
                                        {slot}
                                        </Button>
                                    );
                                })}
                                </TooltipProvider>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                    
                    <Button type="submit" className="w-full mt-auto text-lg py-6" disabled={!selectedTimeSlot}>
                        <Check className="mr-2 h-5 w-5" />
                        Confirm
                    </Button>
                </form>
                </Form>
            </div>
            <div className="hidden md:block relative">
                <Image
                    src={room.image}
                    alt={room.name}
                    fill
                    className="object-cover rounded-r-lg"
                />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
