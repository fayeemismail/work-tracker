"use client";

import React from "react";
import { useWorkout } from "@/context/WorkoutContext";
import { WorkoutExercise } from "@/types";
import { Plus, Minus, Trash2 } from "lucide-react";

interface ExerciseCheckboxProps {
  exercise: WorkoutExercise;
  disabled?: boolean;
}

export function ExerciseCheckbox({ exercise, disabled = false }: ExerciseCheckboxProps) {
  const { toggleSet, addSet, removeSet, deleteExercise } = useWorkout();

  const handleToggleSet = (setIdx: number) => {
    if (disabled || !exercise.id) return;
    toggleSet(exercise.id, setIdx);
  };

  const handleAddSet = () => {
    if (disabled || !exercise.id) return;
    addSet(exercise.id);
  };

  const handleRemoveSet = () => {
    if (disabled || !exercise.id || exercise.sets <= 1) return;
    removeSet(exercise.id);
  };

  const handleDeleteExercise = () => {
    if (disabled || !exercise.id) return;
    if (window.confirm(`Are you sure you want to remove "${exercise.exercise}" from your program?`)) {
      deleteExercise(exercise.id);
    }
  };

  return (
    <div
      className={`flex flex-col gap-3 p-3.5 rounded-xl border transition-all duration-150 ${
        exercise.completed
          ? "border-muted bg-muted/20 text-muted-foreground"
          : "border-border bg-card text-foreground hover:border-muted-foreground/30"
      }`}
    >
      {/* Exercise Information & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col min-w-0 pr-4">
          <span
            className={`text-sm font-semibold transition-all ${
              exercise.completed ? "line-through opacity-60 text-muted-foreground" : "text-foreground"
            }`}
          >
            {exercise.exercise}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {exercise.sets} sets total
          </span>
        </div>

        {/* Set Increment/Decrement Controllers & Delete Actions */}
        {!disabled && (
          <div className="flex items-center gap-1.5">
            {/* Sets Plus/Minus Counter */}
            <div className="flex items-center gap-1 bg-secondary/80 border border-border rounded-lg p-0.5">
              <button
                type="button"
                onClick={handleRemoveSet}
                disabled={exercise.sets <= 1}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-colors disabled:opacity-20 cursor-pointer"
                aria-label="Decrease sets"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-xs font-semibold px-1 min-w-[14px] text-center">
                {exercise.sets}
              </span>
              <button
                type="button"
                onClick={handleAddSet}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-card rounded transition-colors cursor-pointer"
                aria-label="Increase sets"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>

            {/* Trash Delete Action */}
            <button
              type="button"
              onClick={handleDeleteExercise}
              className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              aria-label="Delete exercise"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Set List Checkboxes */}
      <div className="flex flex-wrap gap-2 pt-0.5">
        {Array.from({ length: exercise.sets }).map((_, idx) => {
          const isSetChecked = exercise.completedSets ? exercise.completedSets[idx] : false;

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => handleToggleSet(idx)}
              className={`flex items-center justify-center h-8 px-2.5 rounded-lg border text-xs font-medium transition-all duration-150 ${
                disabled ? "cursor-default" : "cursor-pointer"
              } ${
                isSetChecked
                  ? "bg-primary border-primary text-primary-foreground font-semibold shadow-xs"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
              }`}
            >
              <span>S{idx + 1}</span>
              {isSetChecked && <span className="ml-1 text-[9px] font-bold">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
