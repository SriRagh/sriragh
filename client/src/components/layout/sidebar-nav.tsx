
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, Users, LogOut, Settings, FileText, Briefcase, ChevronDown, Bookmark, LayoutDashboard, LayoutGrid } from 'lucide-react';
import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';


const mainMenuItems = [
  { href: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard, roles: ['Admin'] },
  { href: '/dashboard', label: 'My Dashboard', icon: Home, roles: ['User'] },
];

const bookingMenuItems = [
    { href: '/bookings', label: 'Book a Room', icon: CalendarDays },
    { href: '/my-bookings', label: 'My Bookings', icon: Bookmark },
]

const otherMenuItems = [
    { href: '/users', label: 'Users', icon: Users, roles: ['Admin'] },
    { href: '/rooms', label: 'Manage Rooms', icon: Settings, roles: ['Admin'] },
    { href: '/reports', label: 'Reports', icon: FileText, roles: ['Admin'] },
]


export function SidebarNav() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { state: sidebarState } = useSidebar();
  
  const hasAccess = (roles?: string[]) => {
      if (!roles) return true;
      return user?.role ? roles.includes(user.role) : false;
  }
  
  const handleLogout = async () => {
    await logout();
  };
  
  const isBookingSectionActive = bookingMenuItems.some(item => pathname.startsWith(item.href));

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2.5">
          <LayoutGrid className="w-7 h-7 text-primary" />
           {sidebarState === 'expanded' && (
            <span className="text-lg font-semibold text-sidebar-foreground">
              INNOVAN CONFERENCE ROOM
            </span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {mainMenuItems.filter(item => hasAccess(item.roles)).map((item) => (
              <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  className={cn(
                  'justify-start',
                  pathname.startsWith(item.href) && 'bg-sidebar-accent'
                  )}
              >
                  <Link href={item.href}>
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                  </Link>
              </SidebarMenuButton>
              </SidebarMenuItem>
          ))}
          
          <Collapsible defaultOpen={isBookingSectionActive} className="w-full">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        className="w-full justify-between"
                        isActive={isBookingSectionActive}
                    >
                        <div className="flex items-center gap-3">
                            <Briefcase className="w-5 h-5" />
                            <span>Booking</span>
                        </div>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
            </SidebarMenuItem>
            <CollapsibleContent>
                <div className="pl-7 py-1">
                    <SidebarMenu>
                        {bookingMenuItems.map(item => (
                            <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname.startsWith(item.href)}
                                className={cn(
                                'justify-start h-8',
                                pathname.startsWith(item.href) && 'bg-sidebar-accent'
                                )}
                            >
                                <Link href={item.href}>
                                <item.icon className="w-4 h-4 mr-2.5" />
                                <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </div>
            </CollapsibleContent>
        </Collapsible>


          {otherMenuItems.filter(item => hasAccess(item.roles)).map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(item.href)}
                className={cn(
                  'justify-start',
                   pathname.startsWith(item.href) && 'bg-sidebar-accent'
                )}
              >
                <Link href={item.href}>
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
       <SidebarFooter className="pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="justify-start">
              <LogOut className="w-5 h-5 mr-3" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
