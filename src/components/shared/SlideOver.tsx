import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface SlideOverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SlideOver({
  open,
  onOpenChange,
  title,
  description,
  children,
}: SlideOverProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[92vw] max-w-[92vw] sm:w-auto sm:max-w-md md:max-w-lg overflow-y-auto overflow-x-hidden bg-slate-50 p-4 md:p-6">
        <SheetHeader className="p-0 mb-4 md:mb-6">
          <SheetTitle className="text-xl font-bold text-slate-900">{title}</SheetTitle>
          {description && <SheetDescription className="text-sm">{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex flex-col space-y-6">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
