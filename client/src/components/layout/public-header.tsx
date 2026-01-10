
"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 w-full bg-background/80 backdrop-blur-xl border-b">
      <div className="container mx-auto px-4">
        <div className="h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Building2 className="w-7 h-7 text-primary" />
            <span className="text-lg font-semibold text-foreground">
              INNOVAN CONFERENCE ROOM
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-foreground/80">
            <Link
              href="/"
              className={cn(
                "hover:text-primary transition-colors",
                pathname === "/" && "text-primary font-semibold"
              )}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={cn(
                "hover:text-primary transition-colors",
                pathname === "/about" && "text-primary font-semibold"
              )}
            >
              About Us
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
