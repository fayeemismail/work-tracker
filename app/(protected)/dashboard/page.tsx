"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkout } from "@/context/WorkoutContext";
import { ProfileCard } from "@/components/ProfileCard";
import { WorkoutCard } from "@/components/WorkoutCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { CalendarRange, Sparkles, Smile } from "lucide-react";

export default function Dashboard() {
  const { profile } = useAuth();
  const { workouts, toggleExercise, loading, weeklyProgress, weeklyCompletedCount } = useWorkout();

  // Default to today's day of week
  const todayName = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  }, []);

  const [selectedDay, setSelectedDay] = useState<string>(todayName);

  // Group workouts of the selected day by muscle group
  const groupedDayWorkouts = useMemo(() => {
    const dayWorkouts = workouts.filter((w) => w.day === selectedDay);
    const muscles: Record<string, typeof dayWorkouts> = {};
    
    dayWorkouts.forEach((w) => {
      if (!muscles[w.muscle]) {
        muscles[w.muscle] = [];
      }
      muscles[w.muscle].push(w);
    });
    
    return muscles;
  }, [workouts, selectedDay]);



  if (!profile) return null;

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      
      {/* Page Title Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Track your weekly routine, streaks, and completions.
        </p>
      </div>

      {/* User Profile Card */}
      <ProfileCard profile={profile} />

      {/* Weekly Summary Card */}
      <Card className="border border-border bg-card">
        <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Weekly Goal Progress
            </CardTitle>
            <CardDescription className="text-xs">
              Keep pushing to complete all 24 exercises this week
            </CardDescription>
          </div>
          <span className="text-xs font-bold text-muted-foreground">
            {weeklyCompletedCount} / 24 Done
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <ProgressBar value={weeklyProgress} showLabel />
        </CardContent>
      </Card>

      {/* Day Selector Navigation Row */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            Workout Schedule
          </span>
          {selectedDay === todayName && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
              Viewing Today
            </span>
          )}
        </div>

        {/* Days Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x -mx-4 px-4 md:mx-0 md:px-0">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDay === day;
            const isToday = todayName === day;

            // Check if day is fully completed
            const dayWorkouts = workouts.filter((w) => w.day === day);
            const isDayCompleted = dayWorkouts.length > 0 && dayWorkouts.every((w) => w.completed);

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`snap-center flex flex-col items-center justify-center min-w-[76px] py-2 px-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? "bg-primary border-primary text-primary-foreground font-semibold shadow-sm"
                    : isToday
                    ? "bg-secondary/70 border-foreground/30 text-foreground"
                    : isDayCompleted
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
              >
                <span>{day.substring(0, 3)}</span>
                {isToday && <span className="text-[9px] opacity-75 mt-0.5 font-bold">TODAY</span>}
                {!isToday && isDayCompleted && <span className="text-[9px] opacity-75 mt-0.5">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workout Grid Content */}
      <div className="flex flex-col gap-6">
        
        {selectedDay === "Sunday" ? (
          /* Sunday Rest Day Panel */
          <Card className="border border-dashed border-border bg-secondary/10 py-12 px-6 text-center rounded-2xl flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-foreground border border-border">
              <Smile className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg font-bold text-foreground">Rest & Recovery Day</CardTitle>
            <CardDescription className="max-w-sm mx-auto text-xs text-muted-foreground leading-relaxed">
              Sunday is your scheduled rest day. Give your muscles time to rebuild, hydrate, and prepare for Monday&apos;s Chest & Triceps workout!
            </CardDescription>
          </Card>
        ) : (
          /* Monday - Saturday Workouts */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* If workouts are loading, render skeletons */}
            {loading && workouts.length === 0 ? (
              <>
                <div className="h-48 rounded-xl bg-secondary animate-pulse" />
                <div className="h-48 rounded-xl bg-secondary animate-pulse" />
              </>
            ) : (
              Object.entries(groupedDayWorkouts).map(([muscle, exercises]) => (
                <WorkoutCard
                  key={muscle}
                  muscle={muscle}
                  exercises={exercises}
                  onToggleExercise={toggleExercise}
                  disabled={loading}
                />
              ))
            )}
            
          </div>
        )}

      </div>

    </div>
  );
}
