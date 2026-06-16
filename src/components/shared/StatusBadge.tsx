import React from "react";
import { Badge } from "@/components/ui/badge";

export type Status = 
  | "Pending" 
  | "Processing" 
  | "Sent" 
  | "Confirmed" 
  | "Completed" 
  | "Cancelled" 
  | "Blocked" 
  | "Available" 
  | "Booked" 
  | "Delivered" 
  | "Failed";

interface StatusBadgeProps {
  status: Status;
  className?: string; // Added so you can pass custom margins/padding if needed
}

const statusStyles: Record<Status, string> = {
  Pending: "bg-amber-100 text-amber-800 hover:bg-amber-100/80 border-amber-200",
  Processing: "bg-indigo-100 text-indigo-800 hover:bg-indigo-100/80 border-indigo-200 animate-pulse", // Added pulse animation for processing state
  Sent: "bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200",
  Confirmed: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 border-emerald-200",
  Completed: "bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200",
  Cancelled: "bg-rose-100 text-rose-800 hover:bg-rose-100/80 border-rose-200",
  Blocked: "bg-slate-200 text-slate-800 hover:bg-slate-200/80 border-slate-300",
  Available: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 border-emerald-200",
  Booked: "bg-amber-100 text-amber-800 hover:bg-amber-100/80 border-amber-200",
  Delivered: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 border-emerald-200",
  Failed: "bg-rose-100 text-rose-800 hover:bg-rose-100/80 border-rose-200",
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  // Fallback in case a weird status string sneaks in, preventing a crash
  const style = statusStyles[status] || "bg-slate-100 text-slate-800 border-slate-200";

  return (
    <Badge variant="outline" className={`font-medium ${style} ${className}`}>
      {status}
    </Badge>
  );
}