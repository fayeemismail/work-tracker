import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={twMerge(
          clsx(
            "inline-flex items-center justify-center rounded-lg font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
            // Variants
            {
              "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm": variant === "primary",
              "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
              "border border-border bg-transparent hover:bg-muted/50 text-foreground": variant === "outline",
              "bg-destructive text-destructive-foreground hover:bg-destructive/95 shadow-sm": variant === "danger",
              "hover:bg-muted text-muted-foreground hover:text-foreground": variant === "ghost",
            },
            // Sizes
            {
              "h-8 px-3 text-xs": size === "sm",
              "h-10 px-4 py-2": size === "md",
              "h-11 px-6": size === "lg",
            },
            className
          )
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
