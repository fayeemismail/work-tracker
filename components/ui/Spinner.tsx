import React from "react";
import { twMerge } from "tailwind-merge";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fullPage?: boolean;
}

export function Spinner({ size = "md", className, fullPage = false }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const spinnerElement = (
    <div
      className={twMerge(
        "animate-spin rounded-full border-2 border-secondary border-t-primary",
        sizeClasses[size],
        className
      )}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background text-foreground">
        {spinnerElement}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-4">{spinnerElement}</div>;
}
