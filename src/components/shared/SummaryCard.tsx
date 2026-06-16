import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  iconColor?: string;
}

export function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendValue,
  className,
  iconColor = "text-primary",
}: SummaryCardProps) {
  return (
    <Card className={cn("overflow-hidden border-none shadow-sm", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <div className="flex items-baseline space-x-2">
              <h2 className="text-3xl font-bold text-slate-900">{value}</h2>
              {trend && trendValue && (
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full",
                    trend === "up" ? "text-emerald-700 bg-emerald-100" : "",
                    trend === "down" ? "text-rose-700 bg-rose-100" : "",
                    trend === "neutral" ? "text-slate-700 bg-slate-100" : ""
                  )}
                >
                  {trendValue}
                </span>
              )}
            </div>
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
          <div className={cn("p-3 bg-slate-50 rounded-xl", iconColor.replace('text-', 'bg-').replace('500', '100').replace('primary', 'primary/10'))}>
            <Icon className={cn("w-6 h-6", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
