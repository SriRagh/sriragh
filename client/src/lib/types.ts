
export type Amenity = "Projector" | "Whiteboard" | "Video Conferencing" | "Catering";

export interface Room {
  id: number;
  name: string;
  capacity: number;
  amenities: Amenity[];
  image: string;
  maintenance: boolean;
  location: string;
  status: 'Active' | 'Inactive';
}

export interface RoomContextType {
  rooms: Room[];
  locations: string[];
  isLoading: boolean;
  fetchRooms: () => Promise<void>;
  createRoom: (roomData: Omit<Room, 'id' | 'image' | 'status'>) => Promise<void>;
  updateRoom: (roomId: number, roomData: Omit<Room, 'id' | 'image' | 'status'>) => Promise<void>;
  deleteRoom: (roomId: number) => Promise<void>;
}

export interface BookingContextType {
  bookings: Booking[];
  myBookings: Booking[];
  todaysBookings: Booking[];
  upcomingBookings: Booking[];
  pastBookings: Booking[];
  myTodaysBookings: Booking[];
  myUpcomingBookings: Booking[];
  myPastBookings: Booking[];
  myOngoingBookings: Booking[];
  addBooking: (booking: Omit<Booking, "id" | "roomName">) => Promise<void>;
  updateBooking: (bookingId: number, payload: UpdateBookingPayload) => Promise<void>;
  cancelBooking: (bookingId: number) => Promise<void>;
  setViewDate: (date: Date) => void;
  isLoading: boolean;
  fetchBookings: () => Promise<void>;
  fetchMyBookings: (userId: string | number) => Promise<void>;
}


export interface Booking {
  id: number | null;
  roomId: number;
  roomName: string;
  title: string | null;
  startTime: Date;
  endTime: Date;
  bookedBy?: string;
  requirements?: string;
  location: string;
}

export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  role: "Admin" | "User" | "Guest" | "Moderator";
  status: "Active" | "Inactive" | "Banned" | "Pending" | "Suspended";
  joined: Date;
  lastActive: Date;
  avatar?: string;
  name?: string; // Kept for compatibility
}

export type MeResponse = {
  userId: string | number;
  username: string;
  role: "Admin" | "User" | "Guest" | "Moderator";
  firstName: string;
  lastName: string;
}[];

export type LoginResponse = {
  jwt: string;
  userId: string | number;
};

export interface RoomInfo {
  month: BookingDto[];
  today: BookingDto[];
}

export interface BookingDto {
  bookingId: number | null;
  roomId: number | null;
  roomName: string;
  bookingTitle: string | null;
  createdDate: string; // Assuming ISO date string
  startTime: string | null; // ISO date string
  endTime: string | null; // ISO date string
  bookedUser?: string;
  userName?: string;
  location?: string;
}

export interface RoomDto {
  roomId: number;
  roomName: string;
  capacity: number;
  equipments: string | null;
  maintenance: 'Y' | 'N';
  location: string;
  status: 'Active' | 'Inactive';
}

export interface CreateBookingPayload {
  userId: number;
  roomId: number;
  bookingTitle: string;
  requirements?: string;
  userName: string;
  location: string;
  startTime: string;
  endTime: string;
  timeZone: string;
}

export interface UpdateBookingPayload {
    userId: number;
    roomId: number;
    bookingTitle: string;
    updatedBy: string;
    location: string;
    startTime: string;
    endTime: string;
    timeZone: string;
}

export interface UserDetailsDto {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  role: "Admin" | "User" | "Guest" | "Moderator";
  email: string;
  isActive: "Y" | "N";
  joinedDate: string; // ISO Date string
}
