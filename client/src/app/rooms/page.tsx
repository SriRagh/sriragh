"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pencil,
  Trash2,
  PlusCircle,
  Wrench,
  Check,
  Projector,
  Presentation,
  Tv,
  Utensils,
  ShieldX,
} from "lucide-react";
import type { Room, Amenity } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { useRooms } from "@/context/room-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const allAmenities: Amenity[] = [
  "Projector",
  "Whiteboard",
  "Video Conferencing",
  "Catering",
];

const roomSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Room name is required"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  amenities: z.array(z.string()),
  maintenance: z.boolean(),
  location: z.string().min(1, "Location is required"),
});

type RoomFormValues = z.infer<typeof roomSchema>;

const AmenityIcon = ({ amenity }: { amenity: Amenity }) => {
  const iconProps = { className: "h-4 w-4" };
  switch (amenity) {
    case "Projector":
      return <Projector {...iconProps} />;
    case "Whiteboard":
      return <Presentation {...iconProps} />;
    case "Video Conferencing":
      return <Tv {...iconProps} />;
    case "Catering":
      return <Utensils {...iconProps} />;
    default:
      return <Check {...iconProps} />;
  }
};

export default function RoomsPage() {
  const {
    rooms,
    locations,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    isLoading,
  } = useRooms();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: "",
      capacity: 1,
      amenities: [],
      maintenance: false,
      location: "",
    },
  });

  const handleOpenForm = (room: Room | null) => {
    if (room) {
      setEditingRoom(room);
      form.reset({ ...room, amenities: room.amenities || [] });
    } else {
      setEditingRoom(null);
      form.reset({
        name: "",
        capacity: 1,
        amenities: [],
        maintenance: false,
        id: undefined,
        location: "",
      });
    }
    setIsFormOpen(true);
  };

  const onSubmit = async (data: RoomFormValues) => {
    try {
      const roomData = {
        name: data.name,
        capacity: data.capacity,
        amenities: data.amenities as Amenity[],
        maintenance: data.maintenance,
        location: data.location,
      };

      if (editingRoom) {
        await updateRoom(editingRoom.id, roomData);
        toast({
          title: "Room Updated",
          description: `Details for ${data.name} have been updated.`,
        });
      } else {
        await createRoom(roomData);
        toast({
          title: "Room Created",
          description: `${data.name} has been added.`,
        });
      }
      setIsFormOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (roomId: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this room? This action cannot be undone."
      )
    ) {
      try {
        await deleteRoom(roomId);
        toast({
          title: "Room Deleted",
          description: "The room has been removed.",
          variant: "destructive",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight animate-fade-in-down">
          Room Management
        </h1>
        <p
          className="text-lg text-muted-foreground animate-fade-in-down"
          style={{ animationDelay: "0.1s", animationFillMode: "both" }}
        >
          View, add, and edit conference rooms.
        </p>
      </div>

      <Card
        className="w-full animate-fade-in-up"
        style={{ animationDelay: "0.2s", animationFillMode: "both" }}
      >
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Conference Rooms</CardTitle>
              <CardDescription>
                A list of all conference rooms in your organization.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Button
                className="gap-1.5 w-full sm:w-auto"
                onClick={() => handleOpenForm(null)}
              >
                <PlusCircle className="h-4 w-4" />
                Add Room
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead className="hidden lg:table-cell">Capacity</TableHead>
                <TableHead className="hidden sm:table-cell">
                  Amenities
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-12 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-5 w-10" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rooms.length > 0 ? (
                rooms.map((room, index) => (
                  <TableRow key={room.id}>
                    <TableCell>
                      <div className="w-16 h-12 relative rounded-md overflow-hidden bg-muted">
                        <Image
                          src={room.image}
                          alt={room.name}
                          fill
                          sizes="64px"
                          priority={index < 5}
                          className="object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {room.location}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {room.capacity}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex gap-2 flex-wrap max-w-xs">
                        {room.amenities &&
                          room.amenities.map((amenity) => (
                            <Badge
                              key={amenity}
                              variant="outline"
                              className="flex items-center gap-1.5 py-1 px-2 text-xs"
                            >
                              <AmenityIcon amenity={amenity as Amenity} />
                              {amenity}
                            </Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          room.status === "Active" ? "secondary" : "destructive"
                        }
                        className={cn(
                          room.status === "Active"
                            ? "text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/50 border-green-200 dark:border-green-800"
                            : "items-center gap-1"
                        )}
                      >
                        {room.status === "Active" ? (
                          <Check className="h-3 w-3 mr-1" />
                        ) : (
                          <Wrench className="h-3 w-3" />
                        )}
                        {room.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenForm(room)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(room.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No rooms found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? "Update Room" : "Create Room"}
            </DialogTitle>
            <DialogDescription>
              {editingRoom
                ? "Update the details for this room."
                : "Enter the details for the new room."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 py-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amenities"
                render={() => (
                  <FormItem>
                    <FormLabel>Amenities</FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                      {allAmenities.map((amenity) => (
                        <FormField
                          key={amenity}
                          control={form.control}
                          name="amenities"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={amenity}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(amenity)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([
                                            ...(field.value || []),
                                            amenity,
                                          ])
                                        : field.onChange(
                                            (field.value || []).filter(
                                              (value) => value !== amenity
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal flex items-center gap-2">
                                  <AmenityIcon amenity={amenity} /> {amenity}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maintenance"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Maintenance Mode</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Make the room unavailable for booking.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "Saving..."
                    : editingRoom
                    ? "Update Room"
                    : "Create Room"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
