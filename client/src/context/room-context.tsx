"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import type { Room, RoomDto, RoomContextType, Amenity } from "@/lib/types";
import * as api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./auth-context";

const RoomContext = createContext<RoomContextType | undefined>(undefined);

const roomImageMap: Record<string, string> = {
  Vayu: "https://storage.googleapis.com/innovan-webapp-conference/images/VAYU.png",
  Prithvi:
    "https://storage.googleapis.com/innovan-webapp-conference/images/PRITHVI.png",
  Jal: "https://storage.googleapis.com/innovan-webapp-conference/images/JAL.png",
  Akash:
    "https://storage.googleapis.com/innovan-webapp-conference/images/Akash.png",
  Haleakala:
    "https://storage.googleapis.com/innovan-webapp-conference/images/HALEAKALA.png",
  Pali: "https://storage.googleapis.com/innovan-webapp-conference/images/Pali.png",
  "Napali Coast":
    "https://storage.googleapis.com/innovan-webapp-conference/images/Napali-Coast.png",
  Hanalei:
    "https://storage.googleapis.com/innovan-webapp-conference/images/HANALEI.png",
  Kilauea:
    "https://storage.googleapis.com/innovan-webapp-conference/images/Kilauea.png",
};

const mapRoomDtoToRoom = (dto: RoomDto): Room => {
  const amenities =
    typeof dto.equipments === "string"
      ? (dto.equipments
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean) as Amenity[])
      : [];

  const imageName = dto.roomName.toLowerCase().replace(/\s+/g, "-");
  const defaultImage = `/${imageName}.png`;

  return {
    id: dto.roomId,
    name: dto.roomName,
    capacity: dto.capacity,
    amenities,
    maintenance: dto.maintenance === "Y",
    status: dto.status, // ✅ EXACT MATCH WITH TYPE
    image: roomImageMap[dto.roomName] || defaultImage,
    location: dto.location || "Unknown",
  };
};

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    try {
      const roomDtos = await api.getRooms();
      if (Array.isArray(roomDtos) && roomDtos.length > 0) {
        const roomsWithLocation = roomDtos.map(mapRoomDtoToRoom);
        setRooms(roomsWithLocation);
        const uniqueLocations = Array.from(
          new Set(roomsWithLocation.map((r) => r.location))
        );
        setLocations(uniqueLocations);
      } else {
        setRooms([]);
        setLocations([]);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      setRooms([]);
      setLocations([]);
      toast({
        title: "Error fetching rooms",
        description: "Could not load room data from the server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchRooms();
    } else if (!authLoading && !user) {
      setRooms([]);
      setLocations([]);
      setIsLoading(false);
    }
  }, [authLoading, user, fetchRooms]);

  const createRoom = useCallback(
  async (roomData: Omit<Room, "id" | "image" | "status">) => {
    await api.createRoom(roomData);
    await fetchRooms();
  },
  [fetchRooms]
);

const updateRoom = useCallback(
  async (
    roomId: number,
    roomData: Omit<Room, "id" | "image" | "status">
  ) => {
    await api.updateRoom(roomId, roomData);
    await fetchRooms();
  },
  [fetchRooms]
);


  const deleteRoom = async (roomId: number) => {
    await api.deleteRoom(roomId);
    await fetchRooms();
  };

  const contextValue = useMemo(
    () => ({
      rooms,
      locations,
      isLoading,
      fetchRooms,
      createRoom,
      updateRoom,
      deleteRoom,
    }),
    [
      rooms,
      locations,
      isLoading,
      fetchRooms,
      createRoom,
      updateRoom,
      deleteRoom,
    ]
  );

  return (
    <RoomContext.Provider value={contextValue}>{children}</RoomContext.Provider>
  );
};

export const useRooms = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error("useRooms must be used within a RoomProvider");
  }
  return context;
};
