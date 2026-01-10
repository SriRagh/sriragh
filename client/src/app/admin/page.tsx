"use client";

import React, { useMemo } from "react";
import { useBookings } from "@/context/booking-context";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format, isWithinInterval, isPast } from "date-fns";
import { Pie, PieChart, Cell } from "recharts";
import {
  BookOpenCheck,
  Building,
  Users,
  Calendar,
  Clock,
  Wrench,
  CheckCircle,
  Briefcase,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { useAuth } from "@/context/auth-context";
import { MonthlyCalendarView } from "@/components/monthly-calendar-view";
import { TodayView } from "@/components/today-view";
import { Skeleton } from "@/components/ui/skeleton";
import { useRooms } from "@/context/room-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Room } from "@/lib/types";

const roomDotColors: { [key: string]: string } = {
  Vayu: "hsl(var(--chart-1))",
  Prithvi: "hsl(var(--chart-2))",
  Jal: "hsl(var(--chart-3))",
  Akash: "hsl(var(--chart-4))",
  Haleakala: "hsl(var(--chart-5))",
  Pali: "hsl(var(--chart-1))",
  "Napali Coast": "hsl(var(--chart-2))",
  Hanalei: "hsl(var(--chart-3))",
  Kilauea: "hsl(var(--chart-4))",
};

const PieChartCard = ({
  title,
  data,
  isLoading,
}: {
  title: string;
  data: { name: string; value: number; fill: string }[];
  isLoading: boolean;
}) => {
  const chartConfig = useMemo(() => {
    if (!data) return {};
    return data.reduce((acc, { name, fill }) => {
      acc[name] = { label: name, color: fill };
      return acc;
    }, {} as any);
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent className="flex items-center justify-center pb-4">
          <Skeleton className="h-48 w-48 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in-up flex flex-col">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center">
        {data && data.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square h-full w-full max-h-[300px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={60}
                paddingAngle={5}
                labelLine={false}
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  percent,
                  index,
                }) => {
                  const RADIAN = Math.PI / 180;
                  const radius =
                    innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);

                  return (
                    <text
                      x={x}
                      y={y}
                      fill="white"
                      textAnchor={x > cx ? "start" : "end"}
                      dominantBaseline="central"
                    >
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="-mt-4"
              />
            </PieChart>
          </ChartContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>No booking data available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const StatCard = ({
  title,
  value,
  icon,
  isLoading,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  isLoading: boolean;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-1/2" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
};

export default function AdminPage() {
  const {
    bookings,
    todaysBookings,
    upcomingBookings,
    pastBookings,
    isLoading: loadingStats,
  } = useBookings();
  const { users, loading: loadingUsers } = useAuth();
  const { rooms, isLoading: loadingRooms } = useRooms();

  const roomUsageData = useMemo(() => {
    if (!bookings || bookings.length === 0) return [];
    const counts = bookings
      .filter((b) => b.roomName)
      .reduce((acc, booking) => {
        acc[booking.roomName] = (acc[booking.roomName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      fill: roomDotColors[name] || "hsl(var(--primary))",
    }));
  }, [bookings]);

  const allUpcomingBookings = useMemo(
    () =>
      [...todaysBookings, ...upcomingBookings]
        .filter((b) => !isPast(b.endTime))
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
    [todaysBookings, upcomingBookings]
  );

  const totalRooms = rooms.length;
  const roomsUnderMaintenance = rooms.filter((r: Room) => r.maintenance).length;
  const activeRooms = totalRooms - roomsUnderMaintenance;

  const activeUsers = useMemo(
    () => users.filter((u) => u.status === "Active").length,
    [users]
  );
  const inactiveUsers = useMemo(
    () => users.filter((u) => u.status === "Inactive").length,
    [users]
  );

  const now = new Date();
  const ongoingBookingsCount = bookings.filter(
    (b) =>
      b.startTime &&
      b.endTime &&
      isWithinInterval(now, { start: b.startTime, end: b.endTime })
  ).length;

  if (loadingRooms && rooms.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-5 w-1/2" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!loadingRooms && rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Building className="w-16 h-16 mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No Room Information Found</h2>
        <p className="text-muted-foreground mt-2">
          There are currently no rooms configured in the system.
        </p>
        <p className="text-muted-foreground">
          Please add rooms in the 'Manage Rooms' page to see dashboard
          statistics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          An overview of conference room usage and bookings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Conference Rooms"
          value={totalRooms}
          icon={<Building className="h-5 w-5 text-muted-foreground" />}
          isLoading={loadingRooms}
        />
        <StatCard
          title="Active Rooms"
          value={activeRooms}
          icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          isLoading={loadingRooms}
        />
        <StatCard
          title="Rooms Under Maintenance"
          value={roomsUnderMaintenance}
          icon={<Wrench className="h-5 w-5 text-orange-500" />}
          isLoading={loadingRooms}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="Active Users"
          value={activeUsers}
          icon={<UserCheck className="h-5 w-5 text-green-500" />}
          isLoading={loadingUsers}
        />
        <StatCard
          title="Inactive Users"
          value={inactiveUsers}
          icon={<UserX className="h-5 w-5 text-red-500" />}
          isLoading={loadingUsers}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer bg-card text-card-foreground hover:bg-accent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  New Bookings
                </CardTitle>
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-1/2" />
                ) : (
                  <div className="text-2xl font-bold">
                    {allUpcomingBookings.length}
                  </div>
                )}
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Upcoming Bookings ({allUpcomingBookings.length})
              </DialogTitle>
              <DialogDescription>
                A list of all future conference room bookings.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Meeting</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Booked By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUpcomingBookings.length > 0 ? (
                    allUpcomingBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.roomName}
                        </TableCell>
                        <TableCell>{booking.title}</TableCell>
                        <TableCell>
                          {format(booking.startTime, "PPP")}
                        </TableCell>
                        <TableCell>
                          {format(booking.startTime, "p")} -{" "}
                          {format(booking.endTime, "p")}
                        </TableCell>
                        <TableCell>{booking.bookedBy}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No upcoming bookings.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <StatCard
          title="Ongoing Bookings"
          value={ongoingBookingsCount}
          icon={<Clock className="h-5 w-5 text-blue-500" />}
          isLoading={loadingStats}
        />

        <Dialog>
          <DialogTrigger asChild>
            <Card className="cursor-pointer bg-card text-card-foreground hover:bg-accent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Today's Bookings
                </CardTitle>
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <Skeleton className="h-8 w-1/2" />
                ) : (
                  <div className="text-2xl font-bold">
                    {todaysBookings.length}
                  </div>
                )}
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                Today's Bookings ({todaysBookings.length})
              </DialogTitle>
              <DialogDescription>
                A list of all conference room bookings scheduled for today,{" "}
                {format(new Date(), "PPP")}.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Meeting</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Booked By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaysBookings.length > 0 ? (
                    todaysBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.roomName}
                        </TableCell>
                        <TableCell>{booking.title}</TableCell>
                        <TableCell>
                          {format(booking.startTime, "p")} -{" "}
                          {format(booking.endTime, "p")}
                        </TableCell>
                        <TableCell>{booking.bookedBy}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No bookings for today.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <StatCard
          title="Finished Bookings"
          value={pastBookings.length}
          icon={<BookOpenCheck className="h-5 w-5 text-muted-foreground" />}
          isLoading={loadingStats}
        />
      </div>

      <div className="space-y-6">
        <ScrollArea className="w-full whitespace-nowrap">
          <TodayView title="Today's Schedule" showDatePicker={false} />
        </ScrollArea>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MonthlyCalendarView title="All Bookings Calendar" />
        <div className="space-y-6 lg:col-span-1">
          <PieChartCard
            title="Conference Room Usage"
            data={roomUsageData}
            isLoading={loadingStats}
          />
        </div>
      </div>
    </div>
  );
}
