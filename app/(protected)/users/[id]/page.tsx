"use client";

import React, { useEffect, useState, useMemo, use } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmContext";
import { UserProfile, WorkoutExercise } from "@/types";
import { getUserProfile, getUserWorkouts, deleteUserProfileAndData } from "@/services/db";
import { ProfileCard } from "@/components/ProfileCard";
import { WorkoutCard } from "@/components/WorkoutCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { ArrowLeft, CalendarRange, Smile, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { id: userId } = use(params);
  const { user: currentUser } = useAuth();
  const { confirm } = useConfirm();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDeleteUserProfile = async () => {
    if (!profile) return;
    const isConfirmed = await confirm({
      title: "Remove Trainer Profile",
      message: `Are you sure you want to permanently remove ${profile.name}'s profile and all their workout routine data?`,
      confirmText: "Remove Profile",
      variant: "danger",
    });
    if (isConfirmed) {
      try {
        await deleteUserProfileAndData(profile.uid);
        router.push("/users");
      } catch (err) {
        console.error("Failed to delete user profile:", err);
      }
    }
  };

  // Default weekday view
  const todayName = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  }, []);

  const [selectedDay, setSelectedDay] = useState<string>(todayName);

  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        const userProf = await getUserProfile(userId);
        if (userProf) {
          setProfile(userProf);
          const userWorkouts = await getUserWorkouts(userId);
          setWorkouts(userWorkouts);
        }
      } catch (err) {
        console.error("Failed to load user detail profile data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [userId]);

  // Group workouts of selected day by muscle group
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

  // Calculate statistics
  const { weeklyCompletedCount, weeklyProgress } = useMemo(() => {
    const total = workouts.length;
    const completed = workouts.filter((w) => w.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { weeklyCompletedCount: completed, weeklyProgress: progress };
  }, [workouts]);

  // Check if viewing current logged-in user profile
  const isSelf = currentUser?.uid === userId;
  const isAdmin = currentUser?.email?.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();

  if (loading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-8 w-48 bg-secondary rounded-lg" />
        <div className="h-40 bg-secondary rounded-xl" />
        <div className="h-28 bg-secondary rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16 flex flex-col items-center gap-4">
        <h2 className="text-xl font-bold">Trainer profile not found</h2>
        <p className="text-sm text-muted-foreground">The requested user may not exist or has been removed.</p>
        <Link href="/users">
          <Button variant="primary" size="sm">
            Back to Community
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">

      {/* Back to Community Link & Title */}
      <div className="flex flex-col gap-2 items-start w-full">
        <Link href="/users" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium group">
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Community
        </Link>
        <div className="flex flex-row items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
              {isSelf ? "My Profile" : `${profile.name}'s Profile`}
            </h1>
            {isSelf && (
              <span className="text-xs font-semibold bg-secondary px-2.5 py-1 rounded-full border border-border">
                You
              </span>
            )}
          </div>
          {!isSelf && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteUserProfile}
              className="text-red-500 border-red-500/20 hover:bg-red-500/5 hover:text-red-600 gap-1.5 cursor-pointer ml-auto"
            >
              <Trash2 className="h-4 w-4" />
              Remove Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Card Summary */}
      <ProfileCard profile={profile} />

      {/* Weekly Progress Bar */}
      <Card className="border border-border bg-card">
        <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Weekly Goal Progress
            </CardTitle>
            <CardDescription className="text-xs">
              Completion rating of the 24 exercises split routine
            </CardDescription>
          </div>
          <span className="text-xs font-bold text-muted-foreground">
            {weeklyCompletedCount} / 24 Completed
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <ProgressBar value={weeklyProgress} showLabel />
        </CardContent>
      </Card>

      {/* Day Selector */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            Workout Schedule
          </span>
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            {isSelf ? "Live Checklist" : "Read-Only View"}
          </span>
        </div>

        {/* Day Pills */}
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
                  isDayCompleted
                    ? isSelected
                      ? "bg-emerald-600 border-emerald-600 text-white font-semibold shadow-sm dark:bg-emerald-500 dark:border-emerald-500 dark:text-black"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/5 hover:border-emerald-500/50"
                    : isSelected
                    ? "bg-primary border-primary text-primary-foreground font-semibold shadow-sm"
                    : isToday
                    ? "bg-secondary/70 border-foreground/30 text-foreground"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
              >
                <span>{day.substring(0, 3)}</span>
                {isToday && !isDayCompleted && <span className="text-[9px] opacity-75 mt-0.5 font-bold">TODAY</span>}
                {isDayCompleted && <span className="text-[9px] opacity-75 mt-0.5 font-bold">✓ DONE</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Routine Grid */}
      <div className="flex flex-col gap-6">
        {selectedDay === "Sunday" ? (
          <Card className="border border-dashed border-border bg-secondary/10 py-12 px-6 text-center rounded-2xl flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-foreground border border-border">
              <Smile className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg font-bold text-foreground">Rest Day</CardTitle>
            <CardDescription className="max-w-sm mx-auto text-xs text-muted-foreground">
              No exercises scheduled for Sunday. A day for recovery and muscle repair!
            </CardDescription>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedDayWorkouts).map(([muscle, exercises]) => (
              <WorkoutCard
                key={muscle}
                day={selectedDay}
                muscle={muscle}
                exercises={exercises}
                disabled={true} // Forces all checkboxes to be read-only!
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
