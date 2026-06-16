import React from "react";
import { twMerge } from "tailwind-merge";

interface ProgressBarProps {
  value: number; // 0 to 100
  showLabel?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function ProgressBar({ value, showLabel = false, className, size = "md" }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, isNaN(value) ? 0 : value));
  
  return (
    <div className={twMerge("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-xs">
          <span className="text-muted-foreground font-medium">Progress</span>
          <span className="text-foreground font-semibold">{clampedValue}%</span>
        </div>
      )}
      <div className={twMerge(
        "w-full bg-secondary rounded-full overflow-hidden",
        size === "sm" ? "h-1.5" : "h-2.5"
      )}>
        <div
          className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
