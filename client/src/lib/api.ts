"use client";

import type {
  AppUser,
  LoginResponse,
  MeResponse,
  RoomInfo,
  Booking,
  BookingDto,
  CreateBookingPayload,
  UpdateBookingPayload,
  UserDetailsDto,
  RoomDto,
  Room,
} from "./types";

const BASE_URL = "http://localhost:9022";

const unauthorizedEvent = new Event("unauthorized");

const getHeaders = (includeAuth = true) => {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    window.dispatchEvent(unauthorizedEvent);
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    if (response.status === 204) {
      return Promise.resolve({} as T);
    }

    const errorData = await response
      .json()
      .catch(() => ({ message: `HTTP error! status: ${response.status}` }));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }

  if (response.status === 204) {
    return Promise.resolve({} as T);
  }
  return response.json();
}

export async function loginAndGetToken(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${BASE_URL}/api/auth/token`, {
    method: "POST",
    headers: getHeaders(false),
    body: JSON.stringify({ username, password }),
  });
  return handleResponse<LoginResponse>(response);
}

export async function getMe(userId: string | number): Promise<MeResponse> {
  const response = await fetch(
    `${BASE_URL}/api/user/userInfo?userId=${userId}`,
    {
      headers: getHeaders(),
    }
  );
  return handleResponse<MeResponse>(response);
}

export async function getRoomInformation(
  month: number,
  year: number
): Promise<RoomInfo> {
  const response = await fetch(
    `${BASE_URL}/api/bookings/getRoomInformation?month=${month}&year=${year}`,
    {
      headers: getHeaders(),
    }
  );
  return handleResponse<RoomInfo>(response);
}

export async function getRoomInfoUser(
  userId: string | number
): Promise<BookingDto[]> {
  const response = await fetch(
    `${BASE_URL}/api/bookings/getRoomInfoUser?userId=${userId}`,
    {
      headers: getHeaders(),
    }
  );
  return handleResponse<BookingDto[]>(response);
}

export async function getTodayAndPastBookings(): Promise<BookingDto[]> {
  const response = await fetch(`${BASE_URL}/api/bookings/todayPastBookings`, {
    headers: getHeaders(),
  });
  return handleResponse<BookingDto[]>(response);
}

export async function getFutureBookings(): Promise<BookingDto[]> {
  const response = await fetch(`${BASE_URL}/api/bookings/futureBookings`, {
    headers: getHeaders(),
  });
  return handleResponse<BookingDto[]>(response);
}

export async function getAllMyBookings(): Promise<BookingDto[]> {
  const [todayPast, future] = await Promise.all([
    getTodayAndPastBookings(),
    getFutureBookings(),
  ]);
  return [...todayPast, ...future];
}

export async function createBooking(
  payload: CreateBookingPayload
): Promise<any> {
  const response = await fetch(`${BASE_URL}/api/bookings/create`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<any>(response);
}

export async function updateBooking(
  bookingId: number,
  payload: UpdateBookingPayload
): Promise<any> {
  const response = await fetch(`${BASE_URL}/api/bookings/update/${bookingId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<any>(response);
}

export async function deleteBooking(bookingId: number): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/bookings/delete/${bookingId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });

  if (response.status === 401) {
    window.dispatchEvent(unauthorizedEvent);
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error! status: ${response.status}`);
  }

  return response.text();
}

export async function getActiveUsers(): Promise<UserDetailsDto[]> {
  const response = await fetch(`${BASE_URL}/api/user/activeUsers`, {
    headers: getHeaders(),
  });
  return handleResponse<UserDetailsDto[]>(response);
}

export async function createUser(
  userData: Omit<
    AppUser,
    "id" | "joined" | "lastActive" | "avatar" | "name"
  > & { password?: string }
): Promise<AppUser> {
  const response = await fetch(`${BASE_URL}/api/user/create`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      firstName: userData.firstName,
      lastName: userData.lastName,
      username: userData.username,
      password: userData.password,
      email: userData.email,
      role: userData.role,
      status: userData.status,
    }),
  });
  return handleResponse<AppUser>(response);
}

export async function updateUser(
  userId: string,
  userData: Partial<AppUser>
): Promise<AppUser> {
  const response = await fetch(`${BASE_URL}/api/user/update/${userId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  return handleResponse<AppUser>(response);
}

export async function deleteUser(userId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/user/delete/${userId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (response.status === 401) {
    window.dispatchEvent(unauthorizedEvent);
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: `HTTP error! status: ${response.status}` }));
    throw new Error(
      errorData.message || `HTTP error! status: ${response.status}`
    );
  }
}

export async function getRooms(): Promise<RoomDto[]> {
  const response = await fetch(`${BASE_URL}/api/room/allRoomInfo`, {
    headers: getHeaders(),
  });
  return handleResponse<RoomDto[]>(response);
}

export async function createRoom(
  roomData: Omit<Room, "id" | "image" | "status">
): Promise<Room> {
  const response = await fetch(`${BASE_URL}/api/room/createRoom`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      roomName: roomData.name,
      capacity: roomData.capacity,
      equipments: roomData.amenities.join(","),
      maintenance: roomData.maintenance ? "Y" : "N",
      location: roomData.location,
    }),
  });
  return handleResponse<Room>(response);
}

export async function updateRoom(
  roomId: number,
  roomData: Omit<Room, "id" | "image" | "status">
): Promise<Room> {
  const response = await fetch(`${BASE_URL}/api/room/update/${roomId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({
      roomId: roomId,
      roomName: roomData.name,
      capacity: roomData.capacity,
      equipments: roomData.amenities.join(","),
      maintenance: roomData.maintenance ? "Y" : "N",
      location: roomData.location,
    }),
  });
  return handleResponse<Room>(response);
}

export async function deleteRoom(roomId: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/room/delete/${roomId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}
export async function checkEmailExists(email: string): Promise<number | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/api/user/checkEmail?email=${email}`,
      {
        headers: getHeaders(false),
      }
    );

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("checkEmailExists failed:", error);
    return null;
  }
}

export async function updatePassword(
  userId: string,
  newPassword: string
): Promise<string> {
  const response = await fetch(
    `${BASE_URL}/api/user/updatePassword/${userId}`,
    {
      method: "PUT",
      headers: getHeaders(false),
      body: newPassword,
    }
  );
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP error! status: ${response.status}`);
  }
  return response.text();
}
