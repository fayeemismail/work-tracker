export interface DefaultExerciseTemplate {
  day: string;
  muscle: string;
  exercise: string;
  sets: number;
}

export const DEFAULT_WORKOUT_PLAN: DefaultExerciseTemplate[] = [
  // Monday
  { day: "Monday", muscle: "Chest", exercise: "Bench Press", sets: 3 },
  { day: "Monday", muscle: "Chest", exercise: "Push Ups", sets: 3 },
  { day: "Monday", muscle: "Triceps", exercise: "Dips", sets: 3 },
  { day: "Monday", muscle: "Triceps", exercise: "Rope Pushdown", sets: 3 },

  // Tuesday
  { day: "Tuesday", muscle: "Back", exercise: "Pull Ups", sets: 3 },
  { day: "Tuesday", muscle: "Back", exercise: "Bent Over Row", sets: 3 },
  { day: "Tuesday", muscle: "Biceps", exercise: "Barbell Curl", sets: 3 },
  { day: "Tuesday", muscle: "Biceps", exercise: "Hammer Curl", sets: 3 },

  // Wednesday
  { day: "Wednesday", muscle: "Legs", exercise: "Squats", sets: 3 },
  { day: "Wednesday", muscle: "Legs", exercise: "Leg Press", sets: 3 },
  { day: "Wednesday", muscle: "Abs", exercise: "Crunches", sets: 3 },
  { day: "Wednesday", muscle: "Abs", exercise: "Plank", sets: 3 },

  // Thursday
  { day: "Thursday", muscle: "Shoulders", exercise: "Overhead Press", sets: 3 },
  { day: "Thursday", muscle: "Shoulders", exercise: "Lateral Raise", sets: 3 },
  { day: "Thursday", muscle: "Triceps", exercise: "Skull Crushers", sets: 3 },
  { day: "Thursday", muscle: "Triceps", exercise: "Overhead Extension", sets: 3 },

  // Friday
  { day: "Friday", muscle: "Chest", exercise: "Incline Dumbbell Press", sets: 3 },
  { day: "Friday", muscle: "Chest", exercise: "Chest Fly", sets: 3 },
  { day: "Friday", muscle: "Back", exercise: "Lat Pulldown", sets: 3 },
  { day: "Friday", muscle: "Back", exercise: "Deadlift", sets: 3 },

  // Saturday
  { day: "Saturday", muscle: "Full Body", exercise: "Clean and Press", sets: 3 },
  { day: "Saturday", muscle: "Full Body", exercise: "Kettlebell Swings", sets: 3 },
  { day: "Saturday", muscle: "Cardio", exercise: "Burpees", sets: 3 },
  { day: "Saturday", muscle: "Cardio", exercise: "Jump Rope", sets: 3 },
];

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
