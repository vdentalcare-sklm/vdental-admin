"use client";

import React, { useCallback, useState } from "react";
import { UploadCloud, File, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFileAccepted: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileDropzone({
  onFileAccepted,
  accept = ".csv, .xlsx",
  maxSize = 10,
}: FileDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const processFile = (file: File) => {
    setError(null);
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSize}MB.`);
      return;
    }
    
    // In a real app, you'd check mime type, but here we just check extension for simplicity based on accept string
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!accept.includes(fileExt)) {
      setError(`Invalid file type. Accepted types: ${accept}`);
      return;
    }

    setSelectedFile(file);
    onFileAccepted(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center w-full h-64 rounded-2xl border-2 border-dashed transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-slate-300 hover:border-primary/50 hover:bg-slate-50 bg-white"
          )}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept={accept}
            onChange={handleChange}
          />
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="p-4 bg-primary/10 rounded-full mb-4">
              <UploadCloud className="w-8 h-8 text-primary" />
            </div>
            <p className="mb-2 text-sm text-slate-700 font-medium">
              <span className="font-semibold text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">
              CSV or XLSX (Max {maxSize}MB)
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white border rounded-lg">
              <File className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeFile}
            className="p-2 text-slate-400 hover:text-destructive transition-colors rounded-full hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-sm text-destructive font-medium">{error}</p>}
    </div>
  );
}
