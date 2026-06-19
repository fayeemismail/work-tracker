"use client";

import React from "react";
import { useWorkout } from "@/context/WorkoutContext";
import { useConfirm } from "@/context/ConfirmContext";
import { WorkoutExercise } from "@/types";
import { Plus, Minus, Trash2 } from "lucide-react";

interface ExerciseCheckboxProps {
  exercise: WorkoutExercise;
  disabled?: boolean;
}

export function ExerciseCheckbox({ exercise, disabled = false }: ExerciseCheckboxProps) {
  const { toggleSet, addSet, removeSet, deleteExercise, updateSetWeight } = useWorkout();
  const { confirm } = useConfirm();

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

  const handleDeleteExercise = async () => {
    if (disabled || !exercise.id) return;
    const isConfirmed = await confirm({
      title: "Remove Exercise",
      message: `Are you sure you want to remove "${exercise.exercise}" from your program?`,
      confirmText: "Remove",
      variant: "danger",
    });
    if (isConfirmed) {
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

      {/* Dynamic Set List with Weights in kgs */}
      <div className="flex flex-col gap-2 pt-1 border-t border-border/50 mt-1">
        {Array.from({ length: exercise.sets }).map((_, idx) => {
          const isSetChecked = exercise.completedSets ? exercise.completedSets[idx] : false;
          const currentWeight = exercise.weights && exercise.weights[idx] !== undefined ? exercise.weights[idx] : (15 + idx * 5);

          return (
            <div key={idx} className="flex items-center justify-between gap-3 text-xs py-0.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleToggleSet(idx)}
                  className={`flex items-center justify-center h-6 w-6 rounded-md border transition-all duration-150 ${
                    disabled ? "cursor-default" : "cursor-pointer"
                  } ${
                    isSetChecked
                      ? "bg-primary border-primary text-primary-foreground font-semibold shadow-xs"
                      : "border-border bg-secondary hover:border-muted-foreground/30"
                  }`}
                  aria-label={`Toggle set ${idx + 1}`}
                >
                  {isSetChecked && <span className="text-[10px] font-bold">✓</span>}
                </button>
                <span className={`font-medium ${isSetChecked ? "text-muted-foreground line-through opacity-70" : "text-foreground"}`}>
                  Set {idx + 1}
                </span>
              </div>
              
              {/* Weight Input with Plus/Minus Adjusters */}
              <div className="flex items-center gap-1">
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!exercise.id) return;
                      const newVal = Math.max(0, currentWeight - 5);
                      updateSetWeight(exercise.id, idx, newVal);
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent bg-secondary/80 border border-border rounded transition-colors cursor-pointer"
                    aria-label="Decrease weight by 5kg"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                )}

                <input
                  type="number"
                  min="0"
                  step="5"
                  disabled={disabled}
                  value={currentWeight || ""}
                  placeholder="0"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    const weightVal = isNaN(val) ? 0 : val;
                    if (!exercise.id) return;
                    updateSetWeight(exercise.id, idx, weightVal);
                  }}
                  className="w-12 px-1 py-1 text-center text-xs rounded-lg border border-border bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring placeholder:text-muted-foreground/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!exercise.id) return;
                      const newVal = currentWeight + 5;
                      updateSetWeight(exercise.id, idx, newVal);
                    }}
                    className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent bg-secondary/80 border border-border rounded transition-colors cursor-pointer"
                    aria-label="Increase weight by 5kg"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                )}

                <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider ml-1">kg</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
