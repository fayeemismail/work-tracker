"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { UserProfile } from "@/types";
import { Flame, CheckCircle, ChevronRight } from "lucide-react";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface UserCardProps {
  profile: UserProfile;
}

export function UserCard({ profile }: UserCardProps) {
  // Initials
  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  // Use the day-averaged weekly progress synced directly on the profile, fallback to estimation if not synced
  const completionPercentage = profile.weeklyProgress !== undefined
    ? profile.weeklyProgress
    : (profile.totalWorkouts || 24) > 0
    ? Math.min(100, Math.round(((profile.completedCount || 0) / (profile.totalWorkouts || 24)) * 100))
    : 0;

  return (
    <Link href={`/users/${profile.uid}`} className="block group">
      <Card className="border border-border bg-card hover:border-foreground/20 hover:shadow-md transition-all duration-200 cursor-pointer">
        <CardContent className="p-0 flex flex-col gap-4">
          
          {/* Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground text-sm font-bold border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-transparent transition-all">
                {initials}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary-foreground/90 transition-colors">
                  {profile.name}
                </h4>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Progress Section */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Weekly Completion</span>
              <span className="font-semibold text-foreground">{completionPercentage}%</span>
            </div>
            <ProgressBar value={completionPercentage} size="sm" />
          </div>

          {/* Stats Summary Footer */}
          <div className="grid grid-cols-2 gap-2 border-t border-border/50 pt-3 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10" />
              <span>Streak: <strong className="text-foreground">{profile.streak || 0}d</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              <span>Completed: <strong className="text-foreground">{profile.completedCount || 0}</strong></span>
            </div>
          </div>

        </CardContent>
      </Card>
    </Link>
  );
}
