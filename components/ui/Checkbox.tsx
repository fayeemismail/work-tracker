import React from "react";
import { Check } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Checkbox({ checked, onChange, disabled, className, id }: CheckboxProps) {
  return (
    <button
      id={id}
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={twMerge(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border bg-card transition-all duration-150 hover:bg-accent/50 focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        checked && "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]",
        className
      )}
    >
      {checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
    </button>
  );
}
