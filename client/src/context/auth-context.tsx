"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useMemo,
} from "react";
import type {
  AppUser,
  LoginResponse,
  MeResponse,
  UserDetailsDto,
} from "@/lib/types";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import bcrypt from "bcryptjs";
import { parseISO } from "date-fns";

interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  isLoggingIn: boolean;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  users: AppUser[];
  fetchUsers: () => Promise<void>;
  createUser: (userData: UserFormValues) => Promise<void>;
  updateUser: (userId: string, userData: Partial<AppUser>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

type UserFormValues = Omit<AppUser, "id" | "joined" | "lastActive"> & {
  password?: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userState, setUserState] = useState<{
    user: AppUser | null;
    token: string | null;
  }>({ user: null, token: null });
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();

  const fetchUsers = useCallback(async () => {
    try {
      const fetchedUsers: UserDetailsDto[] = await api.getActiveUsers();

      const formattedUsers: AppUser[] = fetchedUsers.map((u) => ({
        id: String(u.userId),
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.isActive === "Y" ? "Active" : "Inactive",
        joined: u.joinedDate ? parseISO(u.joinedDate) : new Date(),
        lastActive: new Date(), // API doesn't provide lastActive, so using current time as placeholder
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  }, []);

  const logout = useCallback(async () => {
    setUserState({ user: null, token: null });
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
    router.push("/");
  }, [router]);

  // Effect to handle automatic logout on 401 from API
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("unauthorized", handleUnauthorized);
    };
  }, [logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUserState({ user: parsedUser, token: storedToken });
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        setUserState({ user: null, token: null }); // Clear state on error
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  // Fetch users once the user is authenticated
  useEffect(() => {
    if (userState.user) {
      fetchUsers();
    }
  }, [userState.user, fetchUsers]);

  const user = useMemo(() => userState.user, [userState.user]);
  const token = useMemo(() => userState.token, [userState.token]);

  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(logout, IDLE_TIMEOUT);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];

    if (user) {
      resetIdleTimer();
      events.forEach((event) => window.addEventListener(event, resetIdleTimer));
    }

    return () => {
      clearTimeout(idleTimer);
      events.forEach((event) =>
        window.removeEventListener(event, resetIdleTimer)
      );
    };
  }, [user, logout]);

  const login = async (username: string, pass: string) => {
    setIsLoggingIn(true);
    try {
      const { jwt: apiToken, userId } = await api.loginAndGetToken(
        username,
        pass
      );
      localStorage.setItem("token", apiToken);

      const meResponse = await api.getMe(userId);
      const me = meResponse[0];

      const loggedInUser: AppUser = {
        id: String(me.userId),
        username: me.username,
        role: me.role,
        firstName: me.firstName,
        lastName: me.lastName,
        email: me.username,
        status: "Active",
        joined: new Date(),
        lastActive: new Date(),
      };

      setUserState({ user: loggedInUser, token: apiToken });
      localStorage.setItem("user", JSON.stringify(loggedInUser));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const createUser = async (userData: UserFormValues) => {
    const payload: any = { ...userData };
    if (payload.password) {
      const salt = bcrypt.genSaltSync(10);
      payload.password = bcrypt.hashSync(payload.password, salt);
    } else {
      delete payload.password;
    }
    await api.createUser(payload);
    await fetchUsers();
  };

  const updateUser = async (userId: string, userData: Partial<AppUser>) => {
    await api.updateUser(userId, userData);
    await fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    await api.deleteUser(userId);
    await fetchUsers();
  };

  const contextValue = useMemo(
    () => ({
      user,
      token,
      loading,
      isLoggingIn,
      login,
      logout,
      users,
      fetchUsers,
      createUser,
      updateUser,
      deleteUser,
    }),
    [
      user,
      token,
      loading,
      isLoggingIn,
      users,
      logout,
      fetchUsers,
      login,
      createUser,
      updateUser,
      deleteUser,
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
