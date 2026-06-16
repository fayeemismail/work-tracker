"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Dumbbell, Sun, Moon, LogOut } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export function Navbar() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState("light");
  const [mounted, setMounted] = useState(false);
  const { success } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      if (typeof window !== "undefined") {
        const isDark = document.documentElement.classList.contains("dark");
        setTheme(isDark ? "dark" : "light");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setTheme("dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setTheme("light");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      success("Logged out successfully", "Session Ended");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
        
        {/* Brand Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 font-bold text-foreground hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Dumbbell className="h-5 w-5" />
          </div>
          <span className="text-lg tracking-tight font-extrabold">PULSE</span>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Switcher */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {!mounted ? (
              <div className="h-4 w-4" />
            ) : theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="hidden sm:inline-block">
                <Button variant="ghost" size="sm" className="text-sm font-medium">
                  Dashboard
                </Button>
              </Link>
              <Link href="/users" className="hidden sm:inline-block">
                <Button variant="ghost" size="sm" className="text-sm font-medium">
                  Community
                </Button>
              </Link>
              <Link href="/profile" className="hidden sm:inline-block">
                <Button variant="ghost" size="sm" className="text-sm font-medium">
                  Profile
                </Button>
              </Link>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2 h-9 border-border/80 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary" size="sm">
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
