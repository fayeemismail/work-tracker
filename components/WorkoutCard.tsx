"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ExerciseCheckbox } from "./ExerciseCheckbox";
import { WorkoutExercise } from "@/types";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface WorkoutCardProps {
  muscle: string;
  exercises: WorkoutExercise[];
  onToggleExercise: (id: string) => void;
  disabled?: boolean;
}

export function WorkoutCard({ muscle, exercises, onToggleExercise, disabled }: WorkoutCardProps) {
  const progress = useMemo(() => {
    if (exercises.length === 0) return 0;
    const completed = exercises.filter((e) => e.completed).length;
    return Math.round((completed / exercises.length) * 100);
  }, [exercises]);

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
            onToggle={() => exercise.id && onToggleExercise(exercise.id)}
            disabled={disabled}
          />
        ))}
      </CardContent>
    </Card>
  );
}
