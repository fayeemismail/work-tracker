export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  streak: number;
  completedCount: number;
}

export interface WorkoutExercise {
  id?: string;
  userId: string;
  day: string; // "Monday", "Tuesday", etc.
  muscle: string;
  exercise: string;
  sets: number;
  completed: boolean;
  updatedAt: string;
}

export type DaysOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
