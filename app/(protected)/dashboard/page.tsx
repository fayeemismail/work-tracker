"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWorkout } from "@/context/WorkoutContext";
import { ProfileCard } from "@/components/ProfileCard";
import { WorkoutCard } from "@/components/WorkoutCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DAYS_OF_WEEK, PREDEFINED_EXERCISES } from "@/lib/constants";
import { CalendarRange, Sparkles, Smile, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Abs",
  "Calves",
  "Legs",
  "Full Body",
  "Cardio",
  "Custom",
];

export default function Dashboard() {
  const { profile } = useAuth();
  const { workouts, history, loading, weeklyProgress, weeklyCompletedCount, addCustomExercise } = useWorkout();

  // Group history logs by date
  const groupedHistory = useMemo(() => {
    const groups: Record<string, typeof history> = {};
    history.forEach((h) => {
      if (!groups[h.date]) {
        groups[h.date] = [];
      }
      groups[h.date].push(h);
    });
    return groups;
  }, [history]);

  const formatGroupDate = (dateStr: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    if (dateStr === todayStr) {
      return "Today";
    } else if (dateStr === yesterdayStr) {
      return "Yesterday";
    }

    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // Default to today's day of week
  const todayName = useMemo(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[new Date().getDay()];
  }, []);

  const [selectedDay, setSelectedDay] = useState<string>(todayName);

  const [isAddingWorkout, setIsAddingWorkout] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("");
  const [customMuscleGroup, setCustomMuscleGroup] = useState("");
  const [selectedPredefined, setSelectedPredefined] = useState<string[]>([]);
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [newWorkoutSets, setNewWorkoutSets] = useState(3);
  const [isSubmittingWorkout, setIsSubmittingWorkout] = useState(false);

  const handleCreateWorkoutCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalMuscle = selectedMuscleGroup === "Custom" ? customMuscleGroup.trim() : selectedMuscleGroup;
    if (!finalMuscle) return;

    const exercisesToAdd: string[] = [...selectedPredefined];
    if (customExerciseName.trim()) {
      exercisesToAdd.push(customExerciseName.trim());
    }

    if (exercisesToAdd.length === 0) return;

    setIsSubmittingWorkout(true);
    try {
      for (const name of exercisesToAdd) {
        await addCustomExercise(
          selectedDay,
          finalMuscle,
          name,
          newWorkoutSets
        );
      }
      setSelectedMuscleGroup("");
      setCustomMuscleGroup("");
      setSelectedPredefined([]);
      setCustomExerciseName("");
      setNewWorkoutSets(3);
      setIsAddingWorkout(false);
    } catch (err) {
      console.error("Error creating new workout category:", err);
    } finally {
      setIsSubmittingWorkout(false);
    }
  };

  const handleCancelWorkoutAdd = () => {
    setSelectedMuscleGroup("");
    setCustomMuscleGroup("");
    setSelectedPredefined([]);
    setCustomExerciseName("");
    setNewWorkoutSets(3);
    setIsAddingWorkout(false);
  };

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
              <>
                {Object.entries(groupedDayWorkouts).map(([muscle, exercises]) => (
                  <WorkoutCard
                    key={muscle}
                    day={selectedDay}
                    muscle={muscle}
                    exercises={exercises}
                    disabled={loading || selectedDay !== todayName}
                  />
                ))}

                {selectedDay !== todayName ? (
                  /* Read-Only Schedule Notice */
                  <div className="md:col-span-2 text-center py-10 px-6 bg-secondary/10 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 animate-fade-in">
                    <span className="text-sm font-semibold text-foreground">Read-Only Schedule</span>
                    <span className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                      You are viewing {selectedDay}&apos;s schedule. Workouts can only be logged, added, or customized on the active day ({todayName}).
                    </span>
                  </div>
                ) : !isAddingWorkout ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingWorkout(true)}
                    className="flex flex-col items-center justify-center gap-3 w-full min-h-[220px] p-6 border border-dashed border-border rounded-2xl hover:border-foreground/20 hover:bg-secondary/10 hover:shadow-xs transition-all duration-150 cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground border border-border">
                      <Plus className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground block">Add Muscle Group</span>
                      <span className="text-xs text-muted-foreground">Start a new category on {selectedDay}</span>
                    </div>
                  </button>
                ) : (
                  <Card className="flex flex-col gap-4 border border-border bg-card p-5 rounded-2xl shadow-xs animate-scale-up">
                    <CardHeader className="p-0 mb-0 flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold text-foreground uppercase tracking-wider">
                          New Muscle Group
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          Adding to {selectedDay}&apos;s schedule
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <form onSubmit={handleCreateWorkoutCategory} className="flex flex-col gap-3.5">
                      {/* Muscle Group Selector */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Select Muscle Group</label>
                        <select
                          required
                          value={selectedMuscleGroup}
                          onChange={(e) => {
                            setSelectedMuscleGroup(e.target.value);
                            setSelectedPredefined([]);
                          }}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                        >
                          <option value="" disabled>-- Choose a Muscle Group --</option>
                          {MUSCLE_GROUPS.map((mg) => (
                            <option key={mg} value={mg}>{mg}</option>
                          ))}
                        </select>
                      </div>

                      {/* Custom Muscle Group Input */}
                      {selectedMuscleGroup === "Custom" && (
                        <div className="flex flex-col gap-1 animate-fade-in">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Custom Muscle Group Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Calves, Neck, Forearms"
                            value={customMuscleGroup}
                            onChange={(e) => setCustomMuscleGroup(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                            autoFocus
                          />
                        </div>
                      )}

                      {/* Predefined Exercises Pills */}
                      {selectedMuscleGroup && selectedMuscleGroup !== "Custom" && (PREDEFINED_EXERCISES[selectedMuscleGroup] || []).length > 0 && (
                        <div className="flex flex-col gap-1.5 animate-fade-in">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Select Exercises to Add
                          </label>
                          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border border-border rounded-xl bg-card">
                            {(PREDEFINED_EXERCISES[selectedMuscleGroup] || []).map((opt) => {
                              const isSelected = selectedPredefined.includes(opt);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => {
                                    setSelectedPredefined((prev) =>
                                      prev.includes(opt)
                                        ? prev.filter((o) => o !== opt)
                                        : [...prev, opt]
                                    );
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150 cursor-pointer ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                                      : "border-border bg-secondary hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  {opt}
                                  {isSelected && <span className="ml-1 text-[10px]">✓</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Custom Exercise Input */}
                      {selectedMuscleGroup && (
                        <div className="flex flex-col gap-1 animate-fade-in">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {selectedPredefined.length > 0 ? "Or Enter Custom Exercise Name" : "Exercise Name"}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Barbell Squat"
                            value={customExerciseName}
                            onChange={(e) => setCustomExerciseName(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
                            required={selectedPredefined.length === 0}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sets</span>
                          <span className="text-xs text-muted-foreground">{newWorkoutSets} sets total</span>
                        </div>
                        <div className="flex items-center gap-1 bg-secondary border border-border rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => setNewWorkoutSets((prev) => Math.max(1, prev - 1))}
                            disabled={newWorkoutSets <= 1}
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-colors disabled:opacity-20 cursor-pointer"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs font-semibold px-2 min-w-[20px] text-center text-foreground">{newWorkoutSets}</span>
                          <button
                            type="button"
                            onClick={() => setNewWorkoutSets((prev) => prev + 1)}
                            className="p-1 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-colors cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelWorkoutAdd}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          loading={isSubmittingWorkout}
                        >
                          Create
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}
              </>
            )}
            
          </div>
        )}

      </div>

      {/* Workout History Section */}
      <div className="flex flex-col gap-4 mt-8 border-t border-border/60 pt-8 animate-fade-in">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-1.5">
          <CalendarRange className="h-4.5 w-4.5 text-muted-foreground" />
          Recent Activity Timeline
        </h2>
        
        {history.length === 0 ? (
          <Card className="border border-dashed border-border bg-secondary/15 py-8 text-center rounded-2xl">
            <CardDescription className="text-xs text-muted-foreground">
              No recent logged sets. Your training log will populate here as you complete exercise sets!
            </CardDescription>
          </Card>
        ) : (
          <div className="flex flex-col gap-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
            {Object.entries(groupedHistory).map(([dateStr, items]) => (
              <div key={dateStr} className="flex flex-col gap-3 relative pl-8">
                {/* Timeline Dot */}
                <div className="absolute left-1.5 top-1.5 h-3 w-3 rounded-full bg-primary border-4 border-background" />
                
                {/* Date Header */}
                <span className="text-xs font-bold text-foreground tracking-wide uppercase">
                  {formatGroupDate(dateStr)}
                </span>
                
                {/* Daily Activity List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                  {items.map((item, idx) => {
                    const completedCount = item.completedSets.filter(Boolean).length;
                    return (
                      <div key={idx} className="p-3.5 rounded-xl border border-border bg-card hover:border-foreground/10 transition-colors flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-semibold text-muted-foreground block uppercase tracking-wider">
                              {item.muscle}
                            </span>
                            <span className="text-sm font-bold text-foreground">
                              {item.exercise}
                            </span>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            item.completed 
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                              : "bg-secondary text-muted-foreground border border-border"
                          }`}>
                            {completedCount} / {item.sets} Sets Completed
                          </span>
                        </div>
                        
                        {item.weights && item.weights.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40 mt-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Weights:</span>
                            {item.weights.map((w, sIdx) => (
                              <span key={sIdx} className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                item.completedSets[sIdx] 
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : "bg-secondary text-muted-foreground border border-border"
                              }`}>
                                {w} kg
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
