"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { WorkoutExercise } from "@/types";
import { getUserWorkouts, toggleWorkoutExercise, updateUserStreak } from "@/services/db";

interface WorkoutContextType {
  workouts: WorkoutExercise[];
  loading: boolean;
  toggleExercise: (exerciseId: string) => Promise<void>;
  refreshWorkouts: () => Promise<void>;
  todayWorkout: WorkoutExercise[];
  todayCompletedCount: number;
  todayTotalCount: number;
  todayProgress: number;
  weeklyCompletedCount: number;
  weeklyProgress: number;
  streak: number;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshWorkouts = React.useCallback(async () => {
    if (!user) {
      setTimeout(() => setWorkouts([]), 0);
      return;
    }
    setTimeout(() => setLoading(true), 0);
    try {
      const data = await getUserWorkouts(user.uid);
      setTimeout(() => setWorkouts(data), 0);
    } catch (err) {
      console.error("Error loading workouts:", err);
    } finally {
      setTimeout(() => setLoading(false), 0);
    }
  }, [user]);

  // Fetch workouts whenever the user logs in
  useEffect(() => {
    if (user) {
      refreshWorkouts();
    } else {
      setTimeout(() => setWorkouts([]), 0);
    }
  }, [user, refreshWorkouts]);

  // Determine current day of week
  const todayName = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  }, []);

  // Filter exercises for today
  const todayWorkout = useMemo(() => {
    return workouts.filter((w) => w.day === todayName);
  }, [workouts, todayName]);

  // Calculate daily stats
  const { todayCompletedCount, todayTotalCount, todayProgress } = useMemo(() => {
    const total = todayWorkout.length;
    const completed = todayWorkout.filter((w) => w.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { todayCompletedCount: completed, todayTotalCount: total, todayProgress: progress };
  }, [todayWorkout]);

  // Calculate weekly stats
  const { weeklyCompletedCount, weeklyProgress } = useMemo(() => {
    const total = workouts.length; // 24
    const completed = workouts.filter((w) => w.completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { weeklyCompletedCount: completed, weeklyProgress: progress };
  }, [workouts]);

  // Calculate Streak
  const streak = useMemo(() => {
    if (workouts.length === 0) return 0;
    
    const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayCompleted: Record<string, boolean> = {};

    daysOrder.forEach((d) => {
      const dayWorkouts = workouts.filter((w) => w.day === d);
      dayCompleted[d] = dayWorkouts.length > 0 && dayWorkouts.every((w) => w.completed);
    });

    let todayIdx = daysOrder.indexOf(todayName);
    if (todayIdx === -1) { // Sunday (Rest day)
      todayIdx = 5; // Saturday
    }

    let activeStreak = 0;
    // Walk backward from today/Saturday to calculate the consecutive streak
    for (let i = todayIdx; i >= 0; i--) {
      const d = daysOrder[i];
      if (dayCompleted[d]) {
        activeStreak++;
      } else {
        // If a past day is NOT completed, the streak is broken.
        // However, if they haven't finished TODAY's workout yet, we don't break the streak immediately
        // if they finished previous days. We only break if they also missed previous days.
        if (i === todayIdx) {
          continue;
        }
        break;
      }
    }
    return activeStreak;
  }, [workouts, todayName]);

  // Sync calculated streak to the DB/User Profile
  useEffect(() => {
    if (user && profile && workouts.length > 0) {
      if (profile.streak !== streak) {
        updateUserStreak(user.uid, streak).then(() => {
          refreshProfile();
        });
      }
    }
  }, [streak, user, profile, workouts, refreshProfile]);

  // Toggle exercise completion with optimistic UI update
  const toggleExercise = async (exerciseId: string) => {
    if (!user) return;

    // Find the item to toggle
    const exerciseIndex = workouts.findIndex((w) => w.id === exerciseId);
    if (exerciseIndex === -1) return;

    const targetExercise = workouts[exerciseIndex];
    const originalCompleted = targetExercise.completed;
    const newCompleted = !originalCompleted;

    // 1. Optimistic Update local state
    const updatedWorkouts = [...workouts];
    updatedWorkouts[exerciseIndex] = {
      ...targetExercise,
      completed: newCompleted,
      updatedAt: new Date().toISOString(),
    };
    setWorkouts(updatedWorkouts);

    // 2. Database Update
    try {
      await toggleWorkoutExercise(user.uid, exerciseId, newCompleted);
      // Refresh profile to update user's completedCount in UI
      await refreshProfile();
    } catch (err) {
      console.error("Failed to update exercise completion on Firestore:", err);
      // Revert state if DB write fails
      const revertedWorkouts = [...workouts];
      revertedWorkouts[exerciseIndex] = {
        ...targetExercise,
        completed: originalCompleted,
      };
      setWorkouts(revertedWorkouts);
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        loading,
        toggleExercise,
        refreshWorkouts,
        todayWorkout,
        todayCompletedCount,
        todayTotalCount,
        todayProgress,
        weeklyCompletedCount,
        weeklyProgress,
        streak,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
}
