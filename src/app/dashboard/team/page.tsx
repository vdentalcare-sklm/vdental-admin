"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  UploadCloud,
  X,
  Check,
  UserSquare2,
} from "lucide-react";

interface TeamMember {
  id: number;
  name: string;
  role: string;
  image_url: string;
  display_order: number;
}

const EMPTY_FORM = {
  name:          "",
  role:          "",
  display_order: 0,
};

export default function TeamPage() {
  const [members, setMembers]       = useState<TeamMember[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  // Add form
  const [showAdd, setShowAdd]       = useState(false);
  const [addForm, setAddForm]       = useState({ ...EMPTY_FORM });
  const [addFile, setAddFile]       = useState<File | null>(null);
  const [isAdding, setIsAdding]     = useState(false);
  const [addError, setAddError]     = useState("");
  const addFileRef                  = useRef<HTMLInputElement>(null);

  // Edit form
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [editForm, setEditForm]     = useState({ ...EMPTY_FORM });
  const [editFile, setEditFile]     = useState<File | null>(null);
  const [isSaving, setIsSaving]     = useState(false);
  const [editError, setEditError]   = useState("");
  const editFileRef                 = useRef<HTMLInputElement>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch("/api/admin/team");
      setMembers(data.members || []);
    } catch {
      setError("Failed to load team members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // ── Upload helper ─────────────────────────────────────────────────────────
  async function uploadImage(file: File, folder: string): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const token = sessionStorage.getItem("adminSecret") ?? "";
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/upload`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      }
    );
    if (!res.ok) throw new Error("Image upload failed.");
    const data = await res.json();
    return data.url;
  }

  // ── Add ───────────────────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFile) {
      setAddError("Please select a photo.");
      return;
    }
    setIsAdding(true);
    setAddError("");
    try {
      const imageUrl = await uploadImage(addFile, "team");
      await adminFetch("/api/admin/team", {
        method: "POST",
        body: JSON.stringify({
          ...addForm,
          image_url:     imageUrl,
          display_order: Number(addForm.display_order),
        }),
      });
      setAddForm({ ...EMPTY_FORM });
      setAddFile(null);
      if (addFileRef.current) addFileRef.current.value = "";
      setShowAdd(false);
      await loadMembers();
    } catch (err: any) {
      setAddError(err.message ?? "Failed to add team member.");
    } finally {
      setIsAdding(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const startEdit = (member: TeamMember) => {
    setEditingId(member.id);
    setEditForm({
      name:          member.name,
      role:          member.role,
      display_order: member.display_order,
    });
    setEditFile(null);
    setEditError("");
  };

  const handleSave = async (member: TeamMember) => {
    setIsSaving(true);
    setEditError("");
    try {
      let imageUrl: string | undefined;
      if (editFile) {
        imageUrl = await uploadImage(editFile, "team");
      }
      await adminFetch("/api/admin/team", {
        method: "PATCH",
        body: JSON.stringify({
          id:            member.id,
          name:          editForm.name,
          role:          editForm.role,
          display_order: Number(editForm.display_order),
          ...(imageUrl ? { image_url: imageUrl } : {}),
        }),
      });
      setEditingId(null);
      setEditFile(null);
      await loadMembers();
    } catch (err: any) {
      setEditError(err.message ?? "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (member: TeamMember) => {
    if (!confirm(`Delete "${member.name}" from the team?`)) return;
    try {
      await adminFetch("/api/admin/team", {
        method: "DELETE",
        body: JSON.stringify({ id: member.id, image_url: member.image_url }),
      });
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (err: any) {
      alert(err.message ?? "Failed to delete team member.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <Toolbar
          title="Team Manager"
          description="Manage the team members shown on the gallery page."
        />
        <Button
          onClick={() => { setShowAdd(true); setAddError(""); }}
          className="bg-primary text-white shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Member
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
                New Team Member
              </h3>
              <button
                onClick={() => { setShowAdd(false); setAddFile(null); }}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input
                    required
                    value={addForm.name}
                    onChange={(e) =>
                      setAddForm((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g. Dr. Vijay Krishna"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Role / Designation *</Label>
                  <Input
                    required
                    value={addForm.role}
                    onChange={(e) =>
                      setAddForm((p) => ({ ...p, role: e.target.value }))
                    }
                    placeholder="e.g. BDS, MDS – Orthodontics"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label>Photo *</Label>
                  <div
                    className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => addFileRef.current?.click()}
                  >
                    {addFile ? (
                      <p className="text-sm font-medium text-emerald-600 break-all">
                        {addFile.name}
                      </p>
                    ) : (
                      <>
                        <UploadCloud className="mx-auto h-7 w-7 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-500">
                          Click to browse
                        </span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={addFileRef}
                    onChange={(e) => setAddFile(e.target.files?.[0] || null)}
                    className="hidden"
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
                  <p className="text-xs text-slate-400">
                    Lower number appears first.
                  </p>
                </div>
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
                  onClick={() => { setShowAdd(false); setAddFile(null); }}
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
                  {isAdding ? "Adding..." : "Add Member"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Team grid ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
          <UserSquare2 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          No team members yet. Add your first one above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <Card
              key={member.id}
              className="border-slate-200 shadow-sm overflow-hidden"
            >
              {editingId === member.id ? (
                /* ── Inline edit ── */
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Editing
                    </h4>
                    <button
                      onClick={() => { setEditingId(null); setEditFile(null); }}
                      className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Role / Designation</Label>
                    <Input
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, role: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Replace Photo (optional)</Label>
                    <div
                      className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer"
                      onClick={() => editFileRef.current?.click()}
                    >
                      {editFile ? (
                        <p className="text-sm font-medium text-emerald-600 break-all">
                          {editFile.name}
                        </p>
                      ) : (
                        <span className="text-sm text-slate-400">
                          Click to replace photo
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={editFileRef}
                      onChange={(e) =>
                        setEditFile(e.target.files?.[0] || null)
                      }
                      className="hidden"
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

                  {editError && (
                    <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                      {editError}
                    </p>
                  )}

                  <div className="flex gap-2 justify-end pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setEditingId(null); setEditFile(null); }}
                    >
                      <X className="w-3.5 h-3.5 mr-1.5" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={isSaving}
                      onClick={() => handleSave(member)}
                      className="bg-primary text-white"
                    >
                      {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </CardContent>
              ) : (
                /* ── Display view ── */
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.image_url}
                    alt={member.name}
                    className="w-full h-56 object-cover object-top"
                  />
                  <CardContent className="p-5">
                    <h3 className="font-bold text-slate-900 text-base">
                      {member.name}
                    </h3>
                    <p className="text-sm text-primary mt-0.5 mb-4">
                      {member.role}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        Order: {member.display_order}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(member)}
                          className="h-8"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1.5" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(member)}
                          className="h-8 text-rose-600 hover:bg-rose-50 border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}