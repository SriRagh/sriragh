"use client";

import { usePathname, useRouter } from "next/navigation";
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useAuth } from "@/context/auth-context";
import { useEffect } from "react";
import { Skeleton } from "../ui/skeleton";
import { Header } from "./header";
import { PublicHeader } from "@/components/layout/public-header";

const publicRoutes = ["/", "/forgot-password", "/reset-password", "/about"];

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-background text-foreground">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, isLoggingIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const isPublicPage = publicRoutes.includes(pathname);

    if (loading) return; // Wait until authentication state is loaded

    if (isPublicPage) {
      // If we are on a public page and a user is detected, redirect to their dashboard
      if (user) {
        if (pathname === "/") {
          if (user.role === "Admin") {
            router.push("/admin");
          } else {
            router.push("/dashboard");
          }
        }
      }
    } else {
      // If we are not on a public page and there's no user, redirect to login
      if (!user) {
        router.push("/");
      }
    }
  }, [user, loading, isLoggingIn, pathname, router]);

  if (loading && !publicRoutes.includes(pathname)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  // If we are on a public page, render it without the AppLayout
  if (publicRoutes.includes(pathname)) {
    // If we're on a public page but still authenticating or a user exists (and not on login page), show a loader to prevent flicker
    if ((loading || user) && pathname !== "/") {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="h-screen flex flex-col bg-background">
        <PublicHeader />
        <main className="flex-1 relative flex flex-col">{children}</main>
      </div>
    );
  }

  // If still loading or no user for a protected route, don't render the main layout yet
  if (!user || isLoggingIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
