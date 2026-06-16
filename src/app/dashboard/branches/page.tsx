"use client";

import React, { useState, useEffect, useCallback } from "react";
import { adminFetch } from "@/lib/api";
import { Toolbar } from "@/components/shared/Toolbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Phone,
  MapPin,
  Clock,
  Star,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  hours: string;
  map_src: string | null;
  is_main: boolean;
  is_active: boolean;
  display_order: number;
}

const EMPTY_FORM = {
  name:          "",
  address:       "",
  phone:         "",
  hours:         "Mon – Sun | 9:00 AM – 9:00 PM",
  map_src:       "",
  is_main:       false,
  display_order: 0,
};

export default function BranchesPage() {
  const [branches, setBranches]     = useState<Branch[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  // Add form
  const [showAdd, setShowAdd]       = useState(false);
  const [addForm, setAddForm]       = useState({ ...EMPTY_FORM });
  const [isAdding, setIsAdding]     = useState(false);
  const [addError, setAddError]     = useState("");

  // Edit form
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editForm, setEditForm]     = useState({ ...EMPTY_FORM });
  const [isSaving, setIsSaving]     = useState(false);
  const [editError, setEditError]   = useState("");

  const loadBranches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch("/api/admin/branches");
      setBranches(data.branches || []);
    } catch {
      setError("Failed to load branches.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  // ── Add ───────────────────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setAddError("");
    try {
      await adminFetch("/api/admin/branches", {
        method: "POST",
        body: JSON.stringify({
          ...addForm,
          map_src:       addForm.map_src.trim() || null,
          display_order: Number(addForm.display_order),
        }),
      });
      setAddForm({ ...EMPTY_FORM });
      setShowAdd(false);
      await loadBranches();
    } catch (err: any) {
      setAddError(err.message ?? "Failed to add branch.");
    } finally {
      setIsAdding(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const startEdit = (branch: Branch) => {
    setEditingId(branch.id);
    setEditForm({
      name:          branch.name,
      address:       branch.address,
      phone:         branch.phone,
      hours:         branch.hours,
      map_src:       branch.map_src ?? "",
      is_main:       branch.is_main,
      display_order: branch.display_order,
    });
    setEditError("");
  };

  const handleSave = async (id: number) => {
    setIsSaving(true);
    setEditError("");
    try {
      await adminFetch("/api/admin/branches", {
        method: "PATCH",
        body: JSON.stringify({
          id,
          ...editForm,
          map_src:       editForm.map_src.trim() || null,
          display_order: Number(editForm.display_order),
        }),
      });
      setEditingId(null);
      await loadBranches();
    } catch (err: any) {
      setEditError(err.message ?? "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Toggle active ─────────────────────────────────────────────────────────
  const handleToggleActive = async (branch: Branch) => {
    try {
      await adminFetch("/api/admin/branches", {
        method: "PATCH",
        body: JSON.stringify({ id: branch.id, is_active: !branch.is_active }),
      });
      await loadBranches();
    } catch (err: any) {
      alert(err.message ?? "Failed to update branch.");
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (branch: Branch) => {
    if (branch.is_main) {
      alert("Cannot delete the main branch. Assign another branch as main first.");
      return;
    }
    if (
      !confirm(
        `Delete "${branch.name}"? If it has appointments, it will be deactivated instead.`
      )
    )
      return;

    try {
      const data = await adminFetch("/api/admin/branches", {
        method: "DELETE",
        body: JSON.stringify({ id: branch.id }),
      });
      if (data.soft_deleted) {
        alert(data.message);
      }
      await loadBranches();
    } catch (err: any) {
      alert(err.message ?? "Failed to delete branch.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <Toolbar
          title="Branch Manager"
          description="Add, edit, or remove clinic branches shown on the website."
        />
        <Button
          onClick={() => { setShowAdd(true); setAddError(""); }}
          className="bg-primary text-white shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Branch
        </Button>
      </div>

      {error && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* ── Add form ─────────────────────────────────────────────────────── */}
      {showAdd && (
        <Card className="border-primary/30 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold text-slate-900">
                New Branch
              </h3>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label>Branch Name *</Label>
                  <Input
                    required
                    value={addForm.name}
                    onChange={(e) =>
                      setAddForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Visakhapatnam Branch"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone *</Label>
                  <Input
                    required
                    value={addForm.phone}
                    onChange={(e) =>
                      setAddForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Address *</Label>
                <Input
                  required
                  value={addForm.address}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, address: e.target.value }))
                  }
                  placeholder="Full clinic address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label>Hours</Label>
                  <Input
                    value={addForm.hours}
                    onChange={(e) =>
                      setAddForm((p) => ({ ...p, hours: e.target.value }))
                    }
                    placeholder="Mon – Sun | 9:00 AM – 9:00 PM"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    min={0}
                    value={addForm.display_order}
                    onChange={(e) =>
                      setAddForm((p) => ({
                        ...p,
                        display_order: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Google Maps Embed URL</Label>
                <Input
                  value={addForm.map_src}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, map_src: e.target.value }))
                  }
                  placeholder="Paste the src URL from Google Maps → Share → Embed a map"
                />
                <p className="text-xs text-slate-400">
                  Go to Google Maps → Share → Embed a map → copy only the URL
                  inside src="..."
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="is_main_add"
                  type="checkbox"
                  checked={addForm.is_main}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, is_main: e.target.checked }))
                  }
                  className="w-4 h-4 accent-primary"
                />
                <Label htmlFor="is_main_add" className="cursor-pointer">
                  Set as Main Branch
                </Label>
              </div>

              {addError && (
                <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {addError}
                </p>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAdd(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isAdding}
                  className="bg-primary text-white"
                >
                  {isAdding ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {isAdding ? "Adding..." : "Add Branch"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Branch list ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
          No branches yet. Add your first branch above.
        </div>
      ) : (
        <div className="space-y-4">
          {branches.map((branch) => (
            <Card
              key={branch.id}
              className={cn(
                "border-slate-200 shadow-sm transition-all",
                !branch.is_active && "opacity-60"
              )}
            >
              <CardContent className="p-6">
                {editingId === branch.id ? (
                  /* ── Inline edit form ── */
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label>Branch Name *</Label>
                        <Input
                          required
                          value={editForm.name}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, name: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Phone *</Label>
                        <Input
                          required
                          value={editForm.phone}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              phone: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Address *</Label>
                      <Input
                        required
                        value={editForm.address}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            address: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label>Hours</Label>
                        <Input
                          value={editForm.hours}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              hours: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Display Order</Label>
                        <Input
                          type="number"
                          min={0}
                          value={editForm.display_order}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              display_order: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Google Maps Embed URL</Label>
                      <Input
                        value={editForm.map_src}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            map_src: e.target.value,
                          }))
                        }
                        placeholder="Paste the src URL from Google Maps embed"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        id={`is_main_edit_${branch.id}`}
                        type="checkbox"
                        checked={editForm.is_main}
                        onChange={(e) =>
                          setEditForm((p) => ({
                            ...p,
                            is_main: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 accent-primary"
                      />
                      <Label
                        htmlFor={`is_main_edit_${branch.id}`}
                        className="cursor-pointer"
                      >
                        Set as Main Branch
                      </Label>
                    </div>

                    {editError && (
                      <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                        {editError}
                      </p>
                    )}

                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        disabled={isSaving}
                        onClick={() => handleSave(branch.id)}
                        className="bg-primary text-white"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        {isSaving ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── Display view ── */
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    <div className="flex-1 space-y-3 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {branch.name}
                        </h3>
                        {branch.is_main && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                            <Star className="w-3 h-3" />
                            Main
                          </span>
                        )}
                        {!branch.is_active && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full border border-slate-200">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span>{branch.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{branch.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{branch.hours}</span>
                        </div>
                        {branch.map_src && (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-slate-400 text-xs truncate max-w-xs">
                              Map configured
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(branch)}
                        className={cn(
                          "text-xs h-8",
                          branch.is_active
                            ? "text-slate-600 hover:bg-slate-50"
                            : "text-emerald-600 hover:bg-emerald-50 border-emerald-200"
                        )}
                      >
                        {branch.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(branch)}
                        className="h-8"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(branch)}
                        className="h-8 text-rose-600 hover:bg-rose-50 border-rose-200"
                        disabled={branch.is_main}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}