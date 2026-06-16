"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Flame, CheckCircle, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useWorkout } from "@/context/WorkoutContext";

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const { streak, weeklyCompletedCount } = useWorkout();

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Community", href: "/users", icon: Users },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md and up) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card text-card-foreground shrink-0 min-h-[calc(100vh-4rem)] p-6">
        <div className="flex flex-col justify-between h-full gap-6">
          <div className="flex flex-col gap-6">
            
            {/* Quick user welcome */}
            {profile && (
              <div className="flex flex-col gap-1 border-b border-border pb-4">
                <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Welcome</span>
                <span className="text-sm font-bold truncate text-foreground">{profile.name}</span>
                <span className="text-xs text-muted-foreground truncate">{profile.email}</span>
              </div>
            )}

            {/* Navigation links */}
            <nav className="flex flex-col gap-1.5">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick stats sidebar panel */}
          {profile && (
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-secondary/40 border border-border/50 text-xs">
              <span className="font-semibold text-foreground">Weekly Activity</span>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10" />
                  Streak
                </span>
                <strong className="text-foreground">{streak} days</strong>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  Completed
                </span>
                <strong className="text-foreground">{weeklyCompletedCount} reps</strong>
              </div>
            </div>
          )}

        </div>
      </aside>

      {/* Mobile Bottom Tab Bar (hidden on desktop, visible on mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-border bg-background/90 backdrop-blur-md flex items-center justify-around px-4 shadow-lg pb-safe">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-1 py-1 w-20 transition-all ${
                isActive ? "text-primary scale-105 font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] tracking-tight">{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
