"use client";

import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ExerciseCheckbox } from "./ExerciseCheckbox";
import { WorkoutExercise } from "@/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useWorkout } from "@/context/WorkoutContext";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface WorkoutCardProps {
  day: string;
  muscle: string;
  exercises: WorkoutExercise[];
  disabled?: boolean;
}

export function WorkoutCard({ day, muscle, exercises, disabled }: WorkoutCardProps) {
  const { addCustomExercise } = useWorkout();
  const [isAdding, setIsAdding] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newSets, setNewSets] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = useMemo(() => {
    if (exercises.length === 0) return 0;
    const completed = exercises.filter((e) => e.completed).length;
    return Math.round((completed / exercises.length) * 100);
  }, [exercises]);

  const handleAddCustomExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExerciseName.trim()) return;

    setIsSubmitting(true);
    try {
      await addCustomExercise(day, muscle, newExerciseName.trim(), newSets);
      setNewExerciseName("");
      setNewSets(3);
      setIsAdding(false);
    } catch (err) {
      console.error("Error adding custom exercise:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setNewExerciseName("");
    setNewSets(3);
    setIsAdding(false);
  };

  return (
    <Card className="flex flex-col gap-4 overflow-hidden border border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between p-0 mb-0 space-y-0">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">
            {muscle}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {exercises.length} Exercises
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full border border-border">
            {progress}% Completed
          </span>
        </div>
      </CardHeader>
      
      <ProgressBar value={progress} size="sm" />

      <CardContent className="p-0 flex flex-col gap-2">
        {exercises.map((exercise) => (
          <ExerciseCheckbox
            key={exercise.id}
            exercise={exercise}
            disabled={disabled}
          />
        ))}

        {!disabled && !isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="mt-2 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-dashed border-border bg-transparent text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 hover:bg-secondary/20 transition-all duration-150 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Exercise
          </button>
        )}

        {!disabled && isAdding && (
          <form onSubmit={handleAddCustomExercise} className="mt-2 flex flex-col gap-3 p-3.5 rounded-xl border border-border bg-muted/10 animate-fade-in">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Exercise Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Incline Bench Press"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring text-foreground"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sets</span>
                <span className="text-xs text-muted-foreground">{newSets} sets total</span>
              </div>
              <div className="flex items-center gap-1 bg-secondary border border-border rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setNewSets((prev) => Math.max(1, prev - 1))}
                  disabled={newSets <= 1}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-colors disabled:opacity-20 cursor-pointer"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="text-xs font-semibold px-2 min-w-[20px] text-center text-foreground">{newSets}</span>
                <button
                  type="button"
                  onClick={() => setNewSets((prev) => prev + 1)}
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
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={isSubmitting}
              >
                Add
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

