"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminFetch } from "@/lib/api";
import { Toolbar } from "@/components/shared/Toolbar";
import { DataTable, Column } from "@/components/shared/DataTable";
import { SlideOver } from "@/components/shared/SlideOver";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, History, Loader2, Building2 } from "lucide-react";

interface Branch {
  id: number;
  name: string;
}

interface Patient {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  created_at: string;
  total_bookings: number;
  last_appointment_date: string | null;
  branches_visited: string | null;
}

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
type BadgeStatus   = "Pending" | "Confirmed" | "Cancelled" | "Completed";

interface PatientHistory {
  appointment_id: number;
  reason: string | null;
  status: BookingStatus;
  created_at: string;
  branch_id: number;
  branch_name: string;
  slot_date: string | null;
  slot_time: string | null;
}

export default function PatientsPage() {
  const [patients, setPatients]           = useState<Patient[]>([]);
  const [branches, setBranches]           = useState<Branch[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState("");
  const [searchQuery, setSearchQuery]     = useState("");
  const [branchFilter, setBranchFilter]   = useState("All");

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [history, setHistory]             = useState<PatientHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

  // Load branches for filter
  useEffect(() => {
    adminFetch("/api/admin/branches")
      .then((data) => setBranches(data.branches || []))
      .catch(console.error);
  }, []);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (searchQuery)        params.set("search",   searchQuery);
      if (branchFilter !== "All") params.set("branchId", branchFilter);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const data = await adminFetch(`/api/admin/patients${qs}`);
      setPatients(data.patients);
    } catch {
      setError("Failed to load patients. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, branchFilter]);

  useEffect(() => {
    const timer = setTimeout(() => loadPatients(), 300);
    return () => clearTimeout(timer);
  }, [loadPatients]);

  const handleRowClick = async (patient: Patient) => {
    setSelectedPatient(patient);
    setHistory([]);
    setIsSlideOverOpen(true);
    setHistoryLoading(true);
    try {
      const data = await adminFetch(`/api/admin/patients?id=${patient.id}`);
      setHistory(data.history);
    } catch {
      // Non-fatal
    } finally {
      setHistoryLoading(false);
    }
  };

  const columns: Column<Patient>[] = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (item) => (
        <span className="font-medium text-slate-900">{item.name}</span>
      ),
    },
    {
      header: "Phone",
      accessorKey: "phone",
      cell: (item) => (
        <span className="text-slate-600">{item.phone}</span>
      ),
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: (item) => (
        <span className="text-slate-500 text-sm">{item.email ?? "—"}</span>
      ),
    },
    {
      header: "Branches",
      accessorKey: "branches_visited",
      cell: (item) => (
        <span className="text-slate-600 text-sm">
          {item.branches_visited ?? "—"}
        </span>
      ),
    },
    {
      header: "Total Bookings",
      accessorKey: "total_bookings",
      cell: (item) => (
        <span className="font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded-md text-sm">
          {item.total_bookings}
        </span>
      ),
    },
    {
      header: "Last Appointment",
      accessorKey: "last_appointment_date",
      cell: (item) =>
        item.last_appointment_date ? (
          <span className="text-slate-600">
            {new Date(item.last_appointment_date).toLocaleDateString("en-IN", {
              timeZone: "Asia/Kolkata",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        ) : (
          <span className="text-slate-400 italic text-sm">No visits yet</span>
        ),
    },
    {
      header: "Member Since",
      accessorKey: "created_at",
      cell: (item) => (
        <span className="text-slate-500 text-sm">
          {new Date(item.created_at).toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Toolbar
        title="Patients"
        description="All registered patients from the booking system."
        onSearch={setSearchQuery}
        searchPlaceholder="Search by name or phone..."
        filters={
          <Select
            value={branchFilter}
            onValueChange={(v) => v && setBranchFilter(v)}
          >
            <SelectTrigger className="w-full md:w-[180px] bg-white text-base md:text-sm h-12 md:h-10">
              <SelectValue placeholder="Filter Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {error && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={patients}
          onRowClick={handleRowClick}
          mobileRenderer={(item) => (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900">{item.name}</h3>
                  <div className="flex items-center text-sm text-slate-500 mt-1">
                    <Phone className="w-3.5 h-3.5 mr-1.5" />
                    {item.phone}
                  </div>
                  {item.branches_visited && (
                    <div className="flex items-center text-sm text-slate-500 mt-1">
                      <Building2 className="w-3.5 h-3.5 mr-1.5" />
                      {item.branches_visited}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-50">
                <div>
                  <p className="text-xs text-slate-500">Total Bookings</p>
                  <p className="font-mono text-sm font-medium text-slate-900">
                    {item.total_bookings}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last Visit</p>
                  <p className="text-sm font-medium text-slate-900">
                    {item.last_appointment_date
                      ? new Date(item.last_appointment_date).toLocaleDateString(
                          "en-IN",
                          {
                            timeZone: "Asia/Kolkata",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "Never"}
                  </p>
                </div>
              </div>
            </div>
          )}
        />
      )}

      {/* Patient detail slideover */}
      <SlideOver
        open={isSlideOverOpen}
        onOpenChange={setIsSlideOverOpen}
        title="Patient Profile"
        description={selectedPatient ? `ID: ${selectedPatient.id}` : ""}
      >
        {selectedPatient && (
          <div className="space-y-6">

            {/* Patient header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-4 border-b">
              <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xl font-bold shrink-0">
                {selectedPatient.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900 truncate">
                  {selectedPatient.name}
                </h3>
                <div className="flex items-center text-sm text-slate-500 mt-0.5">
                  <Phone className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  <span className="truncate">{selectedPatient.phone}</span>
                </div>
                {selectedPatient.email && (
                  <p className="text-sm text-slate-400 mt-0.5 truncate">
                    {selectedPatient.email}
                  </p>
                )}
                {selectedPatient.branches_visited && (
                  <div className="flex items-center text-sm text-slate-500 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    <span className="truncate">
                      {selectedPatient.branches_visited}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-xs text-slate-500 mb-1">Total Bookings</p>
                <p className="text-2xl font-bold text-slate-900">
                  {selectedPatient.total_bookings}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-xs text-slate-500 mb-1">Member Since</p>
                <p className="text-sm font-semibold text-slate-900">
                  {new Date(selectedPatient.created_at).toLocaleDateString(
                    "en-IN",
                    {
                      timeZone: "Asia/Kolkata",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>
            </div>

            {/* Appointment history */}
            <div className="space-y-3 pt-2">
              <h5 className="text-sm font-semibold text-slate-900 flex items-center">
                <History className="w-4 h-4 mr-2 text-slate-500" />
                Appointment History
              </h5>

              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-primary w-5 h-5" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-slate-400 italic py-4 text-center">
                  No appointments recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {history.map((h) => (
                    <div
                      key={h.appointment_id}
                      className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {h.branch_name}
                          </div>
                          <span className="text-xs text-slate-400">
                            {h.slot_date
                              ? new Date(h.slot_date).toLocaleDateString(
                                  "en-IN",
                                  {
                                    timeZone: "Asia/Kolkata",
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )
                              : new Date(h.created_at).toLocaleDateString(
                                  "en-IN",
                                  { timeZone: "Asia/Kolkata" }
                                )}
                            {h.slot_time && (
                              <span className="ml-1 text-slate-300">
                                · {h.slot_time}
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="shrink-0">
                          <StatusBadge
                            status={
                              (h.status.charAt(0).toUpperCase() +
                                h.status.slice(1)) as BadgeStatus
                            }
                          />
                        </div>
                      </div>
                      <p className="text-sm font-medium text-slate-800">
                        {h.reason ?? "No reason recorded"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </SlideOver>
    </div>
  );
}