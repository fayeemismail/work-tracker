export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  streak: number;
  bestStreak?: number; // All-time highest streak
  completedCount: number;
  totalWorkouts?: number; // Total number of scheduled workouts
  weeklyProgress?: number; // Weekly progress percentage (0-100)
}

export interface WorkoutExercise {
  id?: string;
  userId: string;
  day: string; // "Monday", "Tuesday", etc.
  muscle: string;
  exercise: string;
  sets: number;
  completed: boolean;
  completedSets: boolean[]; // Array representing completion state of each individual set
  weights?: number[]; // Weights in kgs for each set
  updatedAt: string;
}

export type DaysOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface WorkoutHistoryLog {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  muscle: string;
  exercise: string;
  sets: number;
  completedSets: boolean[];
  weights: number[];
  completed: boolean;
  timestamp: string; // ISO String
}

