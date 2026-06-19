"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useAuth } from "./AuthContext";
import { WorkoutExercise, WorkoutHistoryLog } from "@/types";
import {
  getUserWorkouts,
  updateWorkoutSets,
  updateUserStreak,
  addCustomWorkoutExercise,
  deleteWorkoutExercise,
  logWorkoutHistory,
  getUserWorkoutHistory,
  cleanOldHistoryLogs,
  deleteMuscleGroupExercises,
  syncUserProfileStats,
} from "@/services/db";

interface WorkoutContextType {
  workouts: WorkoutExercise[];
  history: WorkoutHistoryLog[];
  loading: boolean;
  toggleExercise: (exerciseId: string) => Promise<void>;
  toggleSet: (exerciseId: string, setIndex: number) => Promise<void>;
  addSet: (exerciseId: string) => Promise<void>;
  removeSet: (exerciseId: string) => Promise<void>;
  updateSetWeight: (exerciseId: string, setIndex: number, weight: number) => Promise<void>;
  addCustomExercise: (day: string, muscle: string, exerciseName: string, sets: number) => Promise<void>;
  deleteExercise: (exerciseId: string) => Promise<void>;
  deleteMuscleGroup: (day: string, muscle: string) => Promise<void>;
  refreshWorkouts: () => Promise<void>;
  refreshHistory: () => Promise<void>;
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
  const [history, setHistory] = useState<WorkoutHistoryLog[]>([]);
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

  const refreshHistory = React.useCallback(async () => {
    if (!user) {
      setTimeout(() => setHistory([]), 0);
      return;
    }
    try {
      const data = await getUserWorkoutHistory(user.uid);
      setTimeout(() => setHistory(data), 0);
    } catch (err) {
      console.error("Error loading history:", err);
    }
  }, [user]);

  // Fetch workouts & history whenever the user logs in, and clean old history
  useEffect(() => {
    if (user) {
      refreshWorkouts();
      cleanOldHistoryLogs(user.uid).then(() => {
        refreshHistory();
      });
    } else {
      setTimeout(() => {
        setWorkouts([]);
        setHistory([]);
      }, 0);
    }
  }, [user, refreshWorkouts, refreshHistory]);

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

  // Calculate weekly stats based on day-averaged completed muscle groups
  const { weeklyCompletedCount, weeklyProgress } = useMemo(() => {
    const completed = workouts.filter((w) => w.completed).length;
    
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dayProgresses: Record<string, number> = {};
    
    days.forEach((day) => {
      if (day === "Sunday") {
        dayProgresses[day] = 100; // Sunday is rest day (100% complete)
        return;
      }
      
      const dayWorkouts = workouts.filter((w) => w.day === day);
      if (dayWorkouts.length === 0) {
        dayProgresses[day] = 100; // Counts as rest day (100% complete)
        return;
      }
      
      // Group workouts by muscle group
      const muscleGroups: Record<string, boolean> = {};
      dayWorkouts.forEach((w) => {
        if (w.muscle) {
          if (muscleGroups[w.muscle] === undefined) {
            muscleGroups[w.muscle] = true;
          }
          if (!w.completed) {
            muscleGroups[w.muscle] = false;
          }
        }
      });
      
      const uniqueMuscles = Object.keys(muscleGroups);
      if (uniqueMuscles.length === 0) {
        dayProgresses[day] = 100;
        return;
      }
      
      const completedMusclesCount = uniqueMuscles.filter((m) => muscleGroups[m]).length;
      
      // Each day's progress has a denominator of 2, capped at 100%
      const progress = Math.min(100, Math.round((completedMusclesCount / 2) * 100));
      dayProgresses[day] = progress;
    });
    
    const sum = Object.values(dayProgresses).reduce((acc, val) => acc + val, 0);
    const weeklyProgressVal = Math.round(sum / 7);
    
    return { weeklyCompletedCount: completed, weeklyProgress: weeklyProgressVal };
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
    for (let i = todayIdx; i >= 0; i--) {
      const d = daysOrder[i];
      if (dayCompleted[d]) {
        activeStreak++;
      } else {
        if (i === todayIdx) {
          continue;
        }
        break;
      }
    }
    return activeStreak;
  }, [workouts, todayName]);

  // Sync calculated streak, completedCount, totalWorkouts, and weeklyProgress to the DB/User Profile
  useEffect(() => {
    if (user && profile && workouts.length > 0) {
      const currentCompleted = workouts.filter((w) => w.completed).length;
      const currentTotal = workouts.length;
      if (
        profile.streak !== streak ||
        profile.completedCount !== currentCompleted ||
        profile.totalWorkouts !== currentTotal ||
        profile.weeklyProgress !== weeklyProgress
      ) {
        syncUserProfileStats(user.uid, {
          streak,
          completedCount: currentCompleted,
          totalWorkouts: currentTotal,
          weeklyProgress,
        }).then(() => {
          refreshProfile();
        });
      }
    }
  }, [streak, user, profile, workouts, weeklyProgress, refreshProfile]);

  // Backwards compatibility fallback toggle for the whole exercise
  const toggleExercise = async (exerciseId: string) => {
    if (!user) return;
    const exerciseIndex = workouts.findIndex((w) => w.id === exerciseId);
    if (exerciseIndex === -1) return;
    const exercise = workouts[exerciseIndex];
    const newCompleted = !exercise.completed;
    const newSetsList = new Array(exercise.sets).fill(newCompleted);
    const currentWeights = exercise.weights || Array.from({ length: exercise.sets }).map((_, sIdx) => 15 + sIdx * 5);

    // Optimistic Update
    const updated = [...workouts];
    updated[exerciseIndex] = {
      ...exercise,
      completed: newCompleted,
      completedSets: newSetsList,
      weights: currentWeights,
      updatedAt: new Date().toISOString(),
    };
    setWorkouts(updated);

    try {
      await updateWorkoutSets(user.uid, exerciseId, newSetsList, exercise.sets, currentWeights);
      await logWorkoutHistory(user.uid, exercise, newSetsList, exercise.sets, currentWeights);
      await refreshProfile();
      await refreshHistory();
    } catch (err) {
      console.error(err);
      refreshWorkouts();
    }
  };

  // Toggle a single set checkbox
  const toggleSet = async (exerciseId: string, setIndex: number) => {
    if (!user) return;

    const exerciseIndex = workouts.findIndex((w) => w.id === exerciseId);
    if (exerciseIndex === -1) return;

    const exercise = workouts[exerciseIndex];
    const updatedSetsList = [...(exercise.completedSets || new Array(exercise.sets).fill(false))];
    updatedSetsList[setIndex] = !updatedSetsList[setIndex];
    const newCompleted = updatedSetsList.length > 0 && updatedSetsList.every((s) => s === true);
    const currentWeights = exercise.weights || Array.from({ length: exercise.sets }).map((_, sIdx) => 15 + sIdx * 5);

    // 1. Optimistic Update
    const updatedWorkouts = [...workouts];
    updatedWorkouts[exerciseIndex] = {
      ...exercise,
      completedSets: updatedSetsList,
      completed: newCompleted,
      weights: currentWeights,
      updatedAt: new Date().toISOString(),
    };
    setWorkouts(updatedWorkouts);

    // 2. Sync to database
    try {
      await updateWorkoutSets(user.uid, exerciseId, updatedSetsList, exercise.sets, currentWeights);
      await logWorkoutHistory(user.uid, exercise, updatedSetsList, exercise.sets, currentWeights);
      await refreshProfile();
      await refreshHistory();
    } catch (err) {
      console.error("Failed to toggle set checklist:", err);
      refreshWorkouts();
    }
  };

  // Add a set to an exercise
  const addSet = async (exerciseId: string) => {
    if (!user) return;
    const exerciseIndex = workouts.findIndex((w) => w.id === exerciseId);
    if (exerciseIndex === -1) return;
    const exercise = workouts[exerciseIndex];
    const updatedSetsList = [...(exercise.completedSets || new Array(exercise.sets).fill(false)), false];
    const currentWeights = exercise.weights || Array.from({ length: exercise.sets }).map((_, sIdx) => 15 + sIdx * 5);
    const lastWeight = currentWeights.length > 0 ? currentWeights[currentWeights.length - 1] : 10;
    const updatedWeights = [...currentWeights, lastWeight + 5];
    const newSetsCount = exercise.sets + 1;
    const newCompleted = false;

    const updatedWorkouts = [...workouts];
    updatedWorkouts[exerciseIndex] = {
      ...exercise,
      sets: newSetsCount,
      completedSets: updatedSetsList,
      weights: updatedWeights,
      completed: newCompleted,
      updatedAt: new Date().toISOString(),
    };
    setWorkouts(updatedWorkouts);

    try {
      await updateWorkoutSets(user.uid, exerciseId, updatedSetsList, newSetsCount, updatedWeights);
      await logWorkoutHistory(user.uid, exercise, updatedSetsList, newSetsCount, updatedWeights);
      await refreshProfile();
      await refreshHistory();
    } catch (err) {
      console.error("Failed to add set:", err);
      refreshWorkouts();
    }
  };
  const removeSet = async (exerciseId: string) => {
    if (!user) return;

    const exerciseIndex = workouts.findIndex((w) => w.id === exerciseId);
    if (exerciseIndex === -1) return;

    const exercise = workouts[exerciseIndex];
    if (exercise.sets <= 1) return;

    const updatedSetsList = [...(exercise.completedSets || new Array(exercise.sets).fill(false))];
    updatedSetsList.pop();
    const updatedWeights = [...(exercise.weights || Array.from({ length: exercise.sets }).map((_, sIdx) => 15 + sIdx * 5))];
    updatedWeights.pop();
    const newSetsCount = exercise.sets - 1;
    const newCompleted = updatedSetsList.length > 0 && updatedSetsList.every((s) => s === true);

    // 1. Optimistic Update
    const updatedWorkouts = [...workouts];
    updatedWorkouts[exerciseIndex] = {
      ...exercise,
      sets: newSetsCount,
      completedSets: updatedSetsList,
      weights: updatedWeights,
      completed: newCompleted,
      updatedAt: new Date().toISOString(),
    };
    setWorkouts(updatedWorkouts);

    // 2. Sync to database
    try {
      await updateWorkoutSets(user.uid, exerciseId, updatedSetsList, newSetsCount, updatedWeights);
      await logWorkoutHistory(user.uid, exercise, updatedSetsList, newSetsCount, updatedWeights);
      await refreshProfile();
      await refreshHistory();
    } catch (err) {
      console.error("Failed to remove set:", err);
      refreshWorkouts();
    }
  };

  // Update set weight
  const updateSetWeight = async (exerciseId: string, setIndex: number, weight: number) => {
    if (!user) return;

    const exerciseIndex = workouts.findIndex((w) => w.id === exerciseId);
    if (exerciseIndex === -1) return;

    const exercise = workouts[exerciseIndex];
    const updatedWeights = [...(exercise.weights || Array.from({ length: exercise.sets }).map((_, sIdx) => 15 + sIdx * 5))];
    updatedWeights[setIndex] = weight;

    // 1. Optimistic Update
    const updatedWorkouts = [...workouts];
    updatedWorkouts[exerciseIndex] = {
      ...exercise,
      weights: updatedWeights,
      updatedAt: new Date().toISOString(),
    };
    setWorkouts(updatedWorkouts);

    // 2. Sync to database
    try {
      const completedSets = exercise.completedSets || new Array(exercise.sets).fill(false);
      await updateWorkoutSets(user.uid, exerciseId, completedSets, exercise.sets, updatedWeights);
      await logWorkoutHistory(user.uid, exercise, completedSets, exercise.sets, updatedWeights);
      await refreshHistory();
    } catch (err) {
      console.error("Failed to update set weight:", err);
      refreshWorkouts();
    }
  };

  // Add custom workout exercise
  const addCustomExercise = async (day: string, muscle: string, exerciseName: string, sets: number) => {
    if (!user) return;
    
    setTimeout(() => setLoading(true), 0);
    try {
      const newWorkout = await addCustomWorkoutExercise(user.uid, day, muscle, exerciseName, sets);
      setWorkouts((prev) => [...prev, newWorkout]);
      await refreshProfile();
    } catch (err) {
      console.error("Failed to add custom exercise:", err);
    } finally {
      setTimeout(() => setLoading(false), 0);
    }
  };

  // Delete workout exercise (custom or standard)
  const deleteExercise = async (exerciseId: string) => {
    if (!user) return;

    setTimeout(() => setLoading(true), 0);
    try {
      await deleteWorkoutExercise(user.uid, exerciseId);
      setWorkouts((prev) => prev.filter((w) => w.id !== exerciseId));
      await refreshProfile();
    } catch (err) {
      console.error("Failed to delete exercise:", err);
    } finally {
      setTimeout(() => setLoading(false), 0);
    }
  };

  // Delete an entire muscle group category on a day
  const deleteMuscleGroup = async (day: string, muscle: string) => {
    if (!user) return;

    setTimeout(() => setLoading(true), 0);
    try {
      await deleteMuscleGroupExercises(user.uid, day, muscle);
      setWorkouts((prev) => prev.filter((w) => !(w.day === day && w.muscle === muscle)));
      await refreshProfile();
    } catch (err) {
      console.error("Failed to delete muscle group category:", err);
    } finally {
      setTimeout(() => setLoading(false), 0);
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        workouts,
        history,
        loading,
        toggleExercise,
        toggleSet,
        addSet,
        removeSet,
        updateSetWeight,
        addCustomExercise,
        deleteExercise,
        deleteMuscleGroup,
        refreshWorkouts,
        refreshHistory,
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
