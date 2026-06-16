"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminFetch } from "@/lib/api";
import { Toolbar } from "@/components/shared/Toolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Trash2, Plus, Ban, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Branch {
  id: number;
  name: string;
}

interface Slot {
  id: number;
  time: string;
  is_booked: boolean;
  booked_by_name: string | null;
  booked_by_phone: string | null;
}

export default function SlotManagerPage() {
  const [branches, setBranches]         = useState<Branch[]>([]);
  const [branchId, setBranchId]         = useState<string>("");
  const [branchesLoading, setBranchesLoading] = useState(true);

  const [date, setDate] = useState(
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
  );
  const [slots, setSlots]               = useState<Slot[]>([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");

  const [newTime, setNewTime]           = useState("09:00");
  const [isAdding, setIsAdding]         = useState(false);
  const [addError, setAddError]         = useState("");

  const [isDateBlocked, setIsDateBlocked]     = useState(false);
  const [blockReason, setBlockReason]         = useState("");
  const [blockId, setBlockId]                 = useState<number | null>(null);
  const [isTogglingBlock, setIsTogglingBlock] = useState(false);

  // Load branches on mount
  useEffect(() => {
    adminFetch("/api/admin/branches")
      .then((data) => {
        const list: Branch[] = data.branches || [];
        setBranches(list);
        if (list.length > 0) setBranchId(String(list[0].id));
      })
      .catch(console.error)
      .finally(() => setBranchesLoading(false));
  }, []);

  const fetchDayData = useCallback(async () => {
    if (!branchId) return;
    setLoading(true);
    setError("");
    try {
      const [slotsData, blockData] = await Promise.all([
        adminFetch(`/api/admin/slots?branchId=${branchId}&date=${date}`),
        adminFetch(`/api/admin/block?branchId=${branchId}&date=${date}`),
      ]);

      setSlots(slotsData.slots || []);

      if (blockData.date_blocked) {
        setIsDateBlocked(true);
        setBlockId(blockData.date_blocked.id);
        setBlockReason(blockData.date_blocked.reason || "");
      } else {
        setIsDateBlocked(false);
        setBlockId(null);
        setBlockReason("");
      }
    } catch {
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [branchId, date]);

  useEffect(() => {
    if (branchId) fetchDayData();
  }, [fetchDayData, branchId]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;
    setIsAdding(true);
    setAddError("");
    try {
      await adminFetch("/api/admin/slots", {
        method: "POST",
        body: JSON.stringify({ branchId: Number(branchId), date, time: newTime }),
      });
      await fetchDayData();
    } catch (err: any) {
      setAddError(err.message ?? "Failed to add slot.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this slot?")) return;
    try {
      await adminFetch("/api/admin/slots", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.message ?? "Failed to delete slot.");
    }
  };

  const toggleBlockDay = async () => {
    if (!branchId) return;
    setIsTogglingBlock(true);
    try {
      if (isDateBlocked && blockId) {
        await adminFetch("/api/admin/block", {
          method: "DELETE",
          body: JSON.stringify({ type: "date", id: blockId }),
        });
      } else {
        await adminFetch("/api/admin/block", {
          method: "POST",
          body: JSON.stringify({
            type: "date",
            branchId: Number(branchId),
            date,
            reason: blockReason || null,
          }),
        });
      }
      await fetchDayData();
    } catch (err: any) {
      alert(err.message ?? "Failed to toggle block status.");
    } finally {
      setIsTogglingBlock(false);
    }
  };

  const availableCount = slots.filter((s) => !s.is_booked).length;
  const bookedCount    = slots.filter((s) => s.is_booked).length;

  const [y, m, d] = date.split("-").map(Number);
  const formattedDate = new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (branchesLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (branches.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        No active branches found. Please add a branch first.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toolbar
        title="Slot Manager"
        description="Manage daily appointment availability per branch."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* ── Left column ── */}
        <div className="space-y-4">

          {/* Branch selector */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Branch</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={branchId} onValueChange={(v) => v && setBranchId(v)}>
                <SelectTrigger className="w-full text-base md:text-sm h-12 md:h-10">
                  <SelectValue placeholder="Choose branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Date picker */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-base md:text-sm h-12 md:h-10"
              />
            </CardContent>
          </Card>

          {/* Add slot — disabled when day is blocked */}
          <Card
            className={cn(
              "border-slate-200 shadow-sm transition-all",
              isDateBlocked && "opacity-40 pointer-events-none select-none"
            )}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add a Slot</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSlot} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="text-base md:text-sm h-12 md:h-10"
                  />
                </div>
                {addError && (
                  <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                    {addError}
                  </p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 h-12 md:h-10 text-base md:text-sm"
                  disabled={isAdding}
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {isAdding ? "Adding..." : "Add Slot"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Block / unblock day */}
          <Card
            className={cn(
              "border shadow-sm transition-colors",
              isDateBlocked
                ? "border-rose-200 bg-rose-50"
                : "border-slate-200 bg-white"
            )}
          >
            <CardHeader className="pb-3">
              <CardTitle
                className={cn(
                  "text-base flex items-center gap-2",
                  isDateBlocked ? "text-rose-800" : "text-slate-900"
                )}
              >
                {isDateBlocked ? (
                  <><Ban className="w-4 h-4" /> Day is Blocked</>
                ) : (
                  <><CalendarCheck className="w-4 h-4 text-emerald-500" /> Day is Open</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isDateBlocked ? (
                <>
                  {blockReason && (
                    <p className="text-sm text-rose-700">
                      Reason: <span className="font-medium">{blockReason}</span>
                    </p>
                  )}
                  <Button
                    onClick={toggleBlockDay}
                    disabled={isTogglingBlock}
                    className="w-full bg-white text-rose-700 hover:bg-rose-100 border border-rose-200 h-12 md:h-10 text-base md:text-sm"
                    variant="outline"
                  >
                    {isTogglingBlock && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Unblock This Day
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="blockReason">Reason (optional)</Label>
                    <Input
                      id="blockReason"
                      placeholder="e.g. Public holiday"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      className="bg-white text-base md:text-sm h-12 md:h-10"
                    />
                  </div>
                  <Button
                    onClick={toggleBlockDay}
                    disabled={isTogglingBlock}
                    className="w-full bg-rose-600 text-white hover:bg-rose-700 h-12 md:h-10 text-base md:text-sm"
                  >
                    {isTogglingBlock ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Ban className="w-4 h-4 mr-2" />
                    )}
                    Block Entire Day
                  </Button>
                  <p className="text-xs text-slate-400 text-center">
                    Patients will be told this branch is closed on this day.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Right column: slots grid ── */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base">{formattedDate}</CardTitle>
                {isDateBlocked && (
                  <p className="text-xs text-rose-500 mt-0.5 font-medium">
                    ⛔ Branch closed — patients cannot book this day
                  </p>
                )}
              </div>
              {slots.length > 0 && !isDateBlocked && (
                <div className="flex gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    {availableCount} open
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    {bookedCount} booked
                  </span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : slots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <p className="font-medium">No slots for this date.</p>
                <p className="text-sm mt-1">
                  {isDateBlocked
                    ? "Unblock the day first, then add slots."
                    : "Use the form on the left to add time slots."}
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 transition-opacity duration-300",
                  isDateBlocked && "opacity-30"
                )}
              >
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={cn(
                      "p-3 rounded-xl border flex flex-col items-center relative group",
                      slot.is_booked
                        ? "bg-amber-50 border-amber-200"
                        : "bg-emerald-50 border-emerald-200"
                    )}
                  >
                    <span
                      className={cn(
                        "font-bold text-sm",
                        slot.is_booked ? "text-amber-800" : "text-emerald-800"
                      )}
                    >
                      {slot.time}
                    </span>

                    {slot.is_booked ? (
                      <>
                        <span className="text-[10px] uppercase font-semibold text-amber-600 mt-0.5">
                          Booked
                        </span>
                        {slot.booked_by_name && (
                          <span className="text-[10px] text-amber-700 mt-1 text-center leading-tight">
                            {slot.booked_by_name}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] uppercase font-semibold text-emerald-600 mt-0.5">
                          Open
                        </span>
                        {!isDateBlocked && (
                          <button
                            onClick={() => handleDelete(slot.id)}
                            className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm border border-slate-200 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete slot"
                          >
                            <Trash2 className="w-3 h-3 text-rose-500" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}