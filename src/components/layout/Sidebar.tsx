"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  Clock,
  LogOut,
  Stethoscope,
  Menu,
  Image as ImageIcon,
  FileText,
  Building2,
  UserSquare2,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const navigation = [
  { name: "Bookings",     href: "/dashboard/bookings",  icon: Calendar },
  { name: "Patients",     href: "/dashboard/patients",  icon: Users },
  { name: "Slot Manager", href: "/dashboard/slots",     icon: Clock },
  { name: "Branches",     href: "/dashboard/branches",  icon: Building2 },
  { name: "Gallery",      href: "/dashboard/gallery",   icon: ImageIcon },
  { name: "Blogs",        href: "/dashboard/blogs",     icon: FileText },
  { name: "Team",         href: "/dashboard/team",      icon: UserSquare2 },
  { name: "Videos",       href: "/dashboard/videos",    icon: Video },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    sessionStorage.removeItem("adminSecret");
    document.cookie = "adminAuth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const currentPage = navigation.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const pageTitle = currentPage ? currentPage.name : "Dashboard";

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-100">
        <Stethoscope className="h-8 w-8 text-primary" />
        <span className="ml-3 text-lg font-bold text-slate-900 tracking-tight">
          V Dental
        </span>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  "group flex items-center px-4 py-3 md:px-3 md:py-2.5 text-base md:text-sm font-medium rounded-lg transition-colors"
                )}
              >
                <item.icon
                  className={cn(
                    isActive
                      ? "text-primary"
                      : "text-slate-400 group-hover:text-slate-600",
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center px-4 py-3 md:px-3 md:py-2.5 text-base md:text-sm font-medium text-slate-600 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-rose-500 transition-colors" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex h-16 w-full items-center justify-between bg-white border-b border-slate-200 px-4 shrink-0 relative z-40">
        <div className="flex items-center">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md">
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[75%] sm:w-[350px] p-0 bg-white">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="flex items-center ml-2">
            <span className="text-lg font-bold text-slate-900">{pageTitle}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 -mr-2 text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-md"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full w-64 flex-col border-r border-slate-200 shadow-sm fixed inset-y-0 z-50">
        <SidebarContent />
      </div>
    </>
  );
}