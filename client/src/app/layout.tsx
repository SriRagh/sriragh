
import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AppProvider } from '@/components/layout/app-provider';
import { AuthProvider } from '@/context/auth-context';
import { RoomProvider } from '@/context/room-context';
import { BookingProvider } from '@/context/booking-context';

export const metadata: Metadata = {
  title: 'Innovan conference room',
  description: 'A streamlined conference room booking app for IT employees.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('antialiased font-sans h-full flex flex-col')}>
        <AuthProvider>
          <RoomProvider>
            <BookingProvider>
              <AppProvider>{children}</AppProvider>
            </BookingProvider>
          </RoomProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
