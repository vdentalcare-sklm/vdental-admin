import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { redirect } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-8 w-full">
          <div className="mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
