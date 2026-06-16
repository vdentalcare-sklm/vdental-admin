"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { adminFetch } from "@/lib/api";
import { Toolbar } from "@/components/shared/Toolbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2, Plus, UploadCloud, ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css"; 

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function BlogsManagerPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch("/api/admin/blogs");
      setBlogs(data.posts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBlogs(); }, [loadBlogs]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    // This auto-generates the slug perfectly based on the title
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please select a cover image.");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "blogs");

      const token = sessionStorage.getItem("adminSecret") ?? "";
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Image upload failed.");
      const uploadData = await uploadRes.json();

      await adminFetch("/api/admin/blogs", {
        method: "POST",
        body: JSON.stringify({
          title, slug, category, excerpt, content_html: contentHtml, image_url: uploadData.url
        }),
      });

      // Reset and Close
      setTitle(""); setSlug(""); setCategory(""); setExcerpt(""); setContentHtml(""); setFile(null);
      setIsEditing(false);
      await loadBlogs();
    } catch (err: any) {
      alert(err.message || "Failed to create blog post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, imageUrl: string) => {
    if (!confirm("Delete this blog post forever?")) return;
    try {
      await adminFetch("/api/admin/blogs", {
        method: "DELETE",
        body: JSON.stringify({ id, image_url: imageUrl }),
      });
      setBlogs((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert("Failed to delete blog.");
    }
  };

  // ─── COMPOSE MODE VIEW ────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center">
            <button 
              onClick={() => setIsEditing(false)}
              className="mr-4 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Write New Post</h1>
              <p className="text-sm text-slate-500">Create a new article for your clinic's blog.</p>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-primary text-white h-10 px-6">
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</> : "Publish Post"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
          {/* Left Column: Settings */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="shadow-sm border-slate-200">
              <CardContent className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="font-bold">Cover Image</Label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {file ? (
                      <p className="text-sm font-medium text-emerald-600 break-all">{file.name}</p>
                    ) : (
                      <>
                        <UploadCloud className="mx-auto h-8 w-8 text-slate-400 mb-3" />
                        <span className="text-sm text-slate-500">Click to browse files</span>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Title</Label>
                  <Input required value={title} onChange={handleTitleChange} placeholder="e.g. Painless Root Canals" />
                </div>
                
                {/* SLUG INPUT: Now Read-Only and styled to look locked */}
                <div className="space-y-2">
                  <Label className="font-bold">URL Slug</Label>
                  <Input 
                    readOnly 
                    value={slug} 
                    placeholder="Auto-generated from title"
                    className="bg-slate-100 font-mono text-sm text-slate-500 cursor-not-allowed focus-visible:ring-0 border-slate-200" 
                  />
                </div>

                <div className="space-y-2"><Label className="font-bold">Category</Label><Input required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Treatments" /></div>
                <div className="space-y-2"><Label className="font-bold">Short Excerpt</Label><textarea required value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={4} className="w-full rounded-md border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="A brief summary..." /></div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Editor */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border-slate-200 h-full">
              <CardContent className="p-0 flex flex-col h-full">
                <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                  <Label className="font-bold text-lg">Blog Content</Label>
                  <p className="text-sm text-slate-500 mt-1">Use the formatting tools below to style your article.</p>
                </div>
                <div className="flex-1 bg-white p-6">
                  {/* Tailwind Warning Fixed: Changed h-[500px] to h-125 */}
                  <ReactQuill 
                    theme="snow" 
                    value={contentHtml} 
                    onChange={setContentHtml} 
                    className="h-125 mb-12"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ─── DEFAULT LIST VIEW ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Toolbar title="Blog Manager" description="Publish and manage your clinic's articles." />
        <Button onClick={() => setIsEditing(true)} className="bg-primary text-white">
          <Plus className="w-4 h-4 mr-2" /> New Post
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((post) => (
            <Card key={post.id} className="overflow-hidden flex flex-col shadow-sm border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image_url} alt={post.title} className="w-full h-48 object-cover" />
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="text-xs text-primary font-bold mb-2 uppercase tracking-wider">{post.category}</div>
                <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2">{post.title}</h3>
                <p className="text-slate-500 text-sm mb-4 line-clamp-2 flex-1">{post.excerpt}</p>
                <div className="flex justify-between items-center border-t pt-4 mt-auto">
                  {/* Tailwind Warning Fixed: Changed max-w-[150px] to max-w-37.5 */}
                  <span className="text-xs text-slate-400 max-w-37.5 truncate">/{post.slug}</span>
                  <button onClick={() => handleDelete(post.id, post.image_url)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-full transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
          {blogs.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-500 font-medium">No blog posts found.</p>
              <Button variant="link" onClick={() => setIsEditing(true)} className="text-primary">Create your first post</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}