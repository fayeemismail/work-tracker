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
  completedSets: boolean[]; // Array representing completion state of each individual set
  updatedAt: string;
}

export type DaysOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
