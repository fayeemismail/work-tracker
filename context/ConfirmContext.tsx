"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { X, AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "warning";
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  showAlert: (message: string, title?: string) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAlert, setIsAlert] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" });
  
  // Use a ref to hold the resolve function from the promise
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions | string): Promise<boolean> => {
    const parsedOpts: ConfirmOptions = typeof opts === "string" ? { message: opts } : opts;
    setOptions(parsedOpts);
    setIsAlert(false);
    setIsOpen(true);
    
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const showAlert = useCallback((message: string, title?: string): Promise<void> => {
    setOptions({ message, title, confirmText: "OK", variant: "primary" });
    setIsAlert(true);
    setIsOpen(true);
    
    return new Promise<void>((resolve) => {
      resolverRef.current = () => resolve();
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  }, []);

  const {
    title = isAlert ? "Alert" : "Confirm Action",
    message,
    confirmText = isAlert ? "OK" : "Confirm",
    cancelText = "Cancel",
    variant = "danger",
  } = options;

  return (
    <ConfirmContext.Provider value={{ confirm, showAlert }}>
      {children}

      {/* Confirmation/Alert Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm bg-card border border-border p-5 rounded-2xl shadow-xl flex flex-col gap-4 animate-scale-up">
            
            {/* Header / Icon */}
            <div className="flex items-start justify-between">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                variant === "danger"
                  ? "bg-red-500/10 border border-red-500/20 text-red-500"
                  : variant === "warning"
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                    : "bg-primary/10 border border-primary/20 text-primary"
              }`}>
                {isAlert ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <HelpCircle className="h-4 w-4" />
                )}
              </div>
              <button
                onClick={() => handleClose(false)}
                className="p-1 hover:bg-muted rounded-lg transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t border-border/50 pt-3 mt-1 text-xs">
              {!isAlert && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClose(false)}
                  className="cursor-pointer h-8 text-xs py-1 px-3"
                >
                  {cancelText}
                </Button>
              )}
              <Button
                variant={variant === "danger" ? "danger" : "primary"}
                size="sm"
                onClick={() => handleClose(true)}
                className="cursor-pointer h-8 text-xs py-1 px-3"
              >
                {confirmText}
              </Button>
            </div>

          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.1s ease-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}
