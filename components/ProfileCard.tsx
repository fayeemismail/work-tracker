"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { UserProfile } from "@/types";
import { Flame, CheckCircle, Mail, Calendar } from "lucide-react";

interface ProfileCardProps {
  profile: UserProfile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  // Get Initials for Avatar
  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  // Clean formatted date
  const createdDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recent";

  return (
    <Card className="relative overflow-hidden border border-border bg-card">
      <CardContent className="p-0 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        
        {/* Left Side: Avatar & Name */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-foreground text-lg font-bold border border-border">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              {profile.name || "Workout Enthusiast"}
            </h2>
            <div className="flex flex-col gap-1 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {profile.email}
              </span>
              <span className="flex items-center gap-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                Joined {createdDate}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Stats */}
        <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-6 border-t sm:border-t-0 border-border pt-4 sm:pt-0">
          
          {/* Streak Stat */}
          <div className="flex flex-col items-start bg-secondary/35 border border-border/40 p-3 rounded-xl min-w-[100px]">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
              <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20 animate-pulse" />
              Active Streak
            </span>
            <span className="text-2xl font-extrabold text-foreground leading-none">
              {profile.streak || 0} <span className="text-xs font-normal text-muted-foreground">days</span>
            </span>
          </div>

          {/* Exercises Completed */}
          <div className="flex flex-col items-start bg-secondary/35 border border-border/40 p-3 rounded-xl min-w-[100px]">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-1">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              Total Finished
            </span>
            <span className="text-2xl font-extrabold text-foreground leading-none">
              {profile.completedCount || 0} <span className="text-xs font-normal text-muted-foreground">reps</span>
            </span>
          </div>

        </div>

      </CardContent>
    </Card>
  );
}
