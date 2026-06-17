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
  X,
  Check,
  Star,
  Video,
} from "lucide-react";
import { FaYoutube } from "react-icons/fa";
import { cn } from "@/lib/utils";

interface VideoItem {
  id: number;
  youtube_id: string;
  title: string;
  duration: string | null;
  is_featured: boolean;
  display_order: number;
}

const EMPTY_FORM = {
  youtube_id:    "",
  title:         "",
  duration:      "",
  is_featured:   false,
  display_order: 0,
};

function getThumbnail(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export default function VideosPage() {
  const [videos, setVideos]         = useState<VideoItem[]>([]);
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

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminFetch("/api/admin/videos");
      setVideos(data.videos || []);
    } catch {
      setError("Failed to load videos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // ── Add ───────────────────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setAddError("");
    try {
      await adminFetch("/api/admin/videos", {
        method: "POST",
        body: JSON.stringify({
          youtube_id:    addForm.youtube_id.trim(),
          title:         addForm.title.trim(),
          duration:      addForm.duration.trim() || null,
          is_featured:   addForm.is_featured,
          display_order: Number(addForm.display_order),
        }),
      });
      setAddForm({ ...EMPTY_FORM });
      setShowAdd(false);
      await loadVideos();
    } catch (err: any) {
      setAddError(err.message ?? "Failed to add video.");
    } finally {
      setIsAdding(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const startEdit = (video: VideoItem) => {
    setEditingId(video.id);
    setEditForm({
      youtube_id:    video.youtube_id,
      title:         video.title,
      duration:      video.duration ?? "",
      is_featured:   video.is_featured,
      display_order: video.display_order,
    });
    setEditError("");
  };

  const handleSave = async (id: number) => {
    setIsSaving(true);
    setEditError("");
    try {
      await adminFetch("/api/admin/videos", {
        method: "PATCH",
        body: JSON.stringify({
          id,
          youtube_id:    editForm.youtube_id.trim(),
          title:         editForm.title.trim(),
          duration:      editForm.duration.trim() || null,
          is_featured:   editForm.is_featured,
          display_order: Number(editForm.display_order),
        }),
      });
      setEditingId(null);
      await loadVideos();
    } catch (err: any) {
      setEditError(err.message ?? "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (video: VideoItem) => {
    if (!confirm(`Delete "${video.title}"?`)) return;
    try {
      await adminFetch("/api/admin/videos", {
        method: "DELETE",
        body: JSON.stringify({ id: video.id }),
      });
      setVideos((prev) => prev.filter((v) => v.id !== video.id));
    } catch (err: any) {
      alert(err.message ?? "Failed to delete video.");
    }
  };

  const featured    = videos.find((v) => v.is_featured);
  const nonFeatured = videos.filter((v) => !v.is_featured);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <Toolbar
          title="Video Manager"
          description="Manage YouTube videos shown on the gallery page."
        />
        <Button
          onClick={() => { setShowAdd(true); setAddError(""); }}
          className="bg-primary text-white shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Video
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
                Add New Video
              </h3>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-5">
              <div className="space-y-1.5">
                <Label>YouTube URL or Video ID *</Label>
                <Input
                  required
                  value={addForm.youtube_id}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, youtube_id: e.target.value }))
                  }
                  placeholder="https://youtu.be/ABC123  or  ABC123"
                />
                <p className="text-xs text-slate-400">
                  Paste the full YouTube link or just the video ID — both work.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Video Title *</Label>
                <Input
                  required
                  value={addForm.title}
                  onChange={(e) =>
                    setAddForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="e.g. Painless Root Canal Treatment"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <Label>Duration</Label>
                  <Input
                    value={addForm.duration}
                    onChange={(e) =>
                      setAddForm((p) => ({ ...p, duration: e.target.value }))
                    }
                    placeholder="e.g. 1:32"
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
                <div className="space-y-1.5 flex flex-col justify-end">
                  <div className="flex items-center gap-3 pb-2">
                    <input
                      id="is_featured_add"
                      type="checkbox"
                      checked={addForm.is_featured}
                      onChange={(e) =>
                        setAddForm((p) => ({
                          ...p,
                          is_featured: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-primary"
                    />
                    <Label htmlFor="is_featured_add" className="cursor-pointer">
                      Set as Featured
                    </Label>
                  </div>
                  <p className="text-xs text-slate-400">
                    Featured video appears large at the top.
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
                  {isAdding ? "Adding..." : "Add Video"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── Video list ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
          <Video className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          No videos yet. Add your first one above.
        </div>
      ) : (
        <div className="space-y-8">

          {/* Featured */}
          {featured && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Featured Video
              </h3>
              <VideoCard
                video={featured}
                editingId={editingId}
                editForm={editForm}
                setEditForm={setEditForm}
                isSaving={isSaving}
                editError={editError}
                onStartEdit={startEdit}
                onSave={handleSave}
                onDelete={handleDelete}
                onCancelEdit={() => setEditingId(null)}
              />
            </div>
          )}

          {/* Rest */}
          {nonFeatured.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <FaYoutube className="w-4 h-4 text-red-400" />
                Other Videos ({nonFeatured.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nonFeatured.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    editingId={editingId}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    isSaving={isSaving}
                    editError={editError}
                    onStartEdit={startEdit}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onCancelEdit={() => setEditingId(null)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── VideoCard sub-component ───────────────────────────────────────────────────

interface VideoCardProps {
  video:        VideoItem;
  editingId:    number | null;
  editForm:     typeof EMPTY_FORM;
  setEditForm:  React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  isSaving:     boolean;
  editError:    string;
  onStartEdit:  (v: VideoItem) => void;
  onSave:       (id: number) => void;
  onDelete:     (v: VideoItem) => void;
  onCancelEdit: () => void;
}

function VideoCard({
  video,
  editingId,
  editForm,
  setEditForm,
  isSaving,
  editError,
  onStartEdit,
  onSave,
  onDelete,
  onCancelEdit,
}: VideoCardProps) {
  const isEditing = editingId === video.id;

  return (
    <Card
      className={cn(
        "border-slate-200 shadow-sm overflow-hidden",
        video.is_featured && "md:col-span-2 lg:col-span-3"
      )}
    >
      {isEditing ? (
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-slate-900">Editing</h4>
            <button
              onClick={onCancelEdit}
              className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1.5">
            <Label>YouTube URL or Video ID</Label>
            <Input
              value={editForm.youtube_id}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, youtube_id: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={editForm.title}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, title: e.target.value }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Input
                value={editForm.duration}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, duration: e.target.value }))
                }
                placeholder="e.g. 1:32"
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

          <div className="flex items-center gap-3">
            <input
              id={`is_featured_edit_${video.id}`}
              type="checkbox"
              checked={editForm.is_featured}
              onChange={(e) =>
                setEditForm((p) => ({ ...p, is_featured: e.target.checked }))
              }
              className="w-4 h-4 accent-primary"
            />
            <Label
              htmlFor={`is_featured_edit_${video.id}`}
              className="cursor-pointer"
            >
              Set as Featured
            </Label>
          </div>

          {editError && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {editError}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={onCancelEdit}>
              <X className="w-3.5 h-3.5 mr-1.5" />
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSaving}
              onClick={() => onSave(video.id)}
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
        <>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getThumbnail(video.youtube_id)}
              alt={video.title}
              className={cn(
                "w-full object-cover",
                video.is_featured ? "h-56" : "h-40"
              )}
            />
            <div className="absolute inset-0 bg-black/30" />

            {video.is_featured && (
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">
                  <Star className="w-3 h-3" />
                  Featured
                </span>
              </div>
            )}

            {video.duration && (
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">
                {video.duration}
              </div>
            )}
          </div>

          <CardContent className="p-4">
            <p className="font-semibold text-slate-900 text-sm line-clamp-2 mb-3">
              {video.title}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                {video.youtube_id}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStartEdit(video)}
                  className="h-8"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(video)}
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
  );
}