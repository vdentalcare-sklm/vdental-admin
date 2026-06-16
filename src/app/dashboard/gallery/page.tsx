"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { adminFetch } from "@/lib/api";
import { Toolbar } from "@/components/shared/Toolbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, UploadCloud, Image as ImageIcon } from "lucide-react";

interface GalleryImage {
  id: number;
  image_url: string;
  alt_text: string;
}

export default function GalleryManagerPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch("/api/admin/gallery");
      setImages(data.images || []);
    } catch (err: any) {
      setError("Failed to load gallery images.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Handle File Upload Process
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError("");

    try {
      // 1. Prepare FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "gallery");

      // 2. Upload to Vercel Blob (Custom fetch because FormData shouldn't have Content-Type set)
      const token = sessionStorage.getItem("adminSecret") ?? "";
      const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Failed to upload file to storage.");
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url;

      // 3. Save URL to Database
      await adminFetch("/api/admin/gallery", {
        method: "POST",
        body: JSON.stringify({ image_url: imageUrl, alt_text: "Smile Transformation" }),
      });

      // 4. Refresh List
      await loadImages();
    } catch (err: any) {
      setError(err.message || "An error occurred during upload.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    }
  };

  // Handle Delete
  const handleDelete = async (id: number, imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      await adminFetch("/api/admin/gallery", {
        method: "DELETE",
        body: JSON.stringify({ id, image_url: imageUrl }),
      });
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err: any) {
      alert("Failed to delete image.");
    }
  };

  return (
    <div className="space-y-6">
      <Toolbar
        title="Gallery Manager"
        description="Upload and manage images shown on the website's gallery page."
      />

      {error && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Upload Section */}
      <Card className="border-slate-200 shadow-sm border-dashed">
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Upload New Image</h3>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            Supported formats: .PNG, .JPG, .JPEG, .WEBP. High-quality images look best on the website.
          </p>
          
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isUploading}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {isUploading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
            ) : (
              <><UploadCloud className="w-4 h-4 mr-2" /> Select Image</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Gallery Grid */}
      <div className="pt-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
          <ImageIcon className="w-5 h-5 mr-2 text-slate-400" />
          Current Gallery ({images.length})
        </h3>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-xl text-slate-400">
            No images in the gallery yet. Upload one above!
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.map((img) => (
              <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-square shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt={img.alt_text}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(img.id, img.image_url)}
                    className="bg-rose-500 hover:bg-rose-600 text-white p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-200"
                    title="Delete Image"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}