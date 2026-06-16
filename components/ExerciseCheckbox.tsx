"use client";

import React from "react";
import { Checkbox } from "@/components/ui/Checkbox";
import { WorkoutExercise } from "@/types";

interface ExerciseCheckboxProps {
  exercise: WorkoutExercise;
  onToggle: () => void;
  disabled?: boolean;
}

export function ExerciseCheckbox({ exercise, onToggle, disabled }: ExerciseCheckboxProps) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-150 ${
        exercise.completed
          ? "border-muted bg-muted/30 text-muted-foreground"
          : "border-border bg-card text-foreground hover:border-muted-foreground/30"
      }`}
    >
      <div className="flex flex-col min-w-0 pr-4">
        <span
          className={`text-sm font-medium transition-all ${
            exercise.completed ? "line-through opacity-60" : ""
          }`}
        >
          {exercise.exercise}
        </span>
        <span className="text-xs text-muted-foreground">
          {exercise.sets} sets
        </span>
      </div>
      <Checkbox
        checked={exercise.completed}
        onChange={onToggle}
        disabled={disabled}
        id={`exercise-${exercise.id}`}
      />
    </div>
  );
}
