import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ToolbarProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
}

export function Toolbar({
  title,
  description,
  actions,
  onSearch,
  searchPlaceholder = "Search...",
  filters,
}: ToolbarProps) {
  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>
      
      <div className="flex flex-col space-y-3 md:flex-row md:items-center md:space-y-0 md:space-x-3 w-full md:w-auto mt-4 md:mt-0">
        {onSearch && (
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              className="pl-9 w-full md:w-64 bg-white border-slate-200 text-base md:text-sm h-12 md:h-10"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        )}
        
        {filters && <div className="flex flex-col md:flex-row md:items-center w-full md:w-auto space-y-3 md:space-y-0 md:space-x-2">{filters}</div>}
        
        {actions && <div className="flex flex-col md:flex-row md:items-center w-full md:w-auto space-y-3 md:space-y-0 md:space-x-2">{actions}</div>}
      </div>
    </div>
  );
}
