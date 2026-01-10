
"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function Header({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
    const isDark = variant === 'dark';
    return (
        <header className={cn(
            "sticky top-0 z-10 flex h-14 items-center gap-4 border-b px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2",
            isDark ? "bg-sidebar text-sidebar-foreground" : "bg-background"
            )}>
            <SidebarTrigger />
        </header>
    )
}
