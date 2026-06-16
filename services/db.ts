import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  writeBatch,
  query,
  where,
  increment,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { UserProfile, WorkoutExercise } from "@/types";
import { DEFAULT_WORKOUT_PLAN } from "@/lib/constants";

// --- SEED DATA FOR DEMO MODE ---
const MOCK_PROFILES: UserProfile[] = [
  {
    uid: "mock-arnold",
    name: "Arnold Schwarzenegger",
    email: "arnold@goldgym.com",
    createdAt: new Date().toISOString(),
    streak: 15,
    completedCount: 64,
  },
  {
    uid: "mock-serena",
    name: "Serena Williams",
    email: "serena@tennis.org",
    createdAt: new Date().toISOString(),
    streak: 8,
    completedCount: 36,
  },
  {
    uid: "mock-cena",
    name: "John Cena",
    email: "youcantseeme@wwe.com",
    createdAt: new Date().toISOString(),
    streak: 22,
    completedCount: 88,
  },
];

// --- LOCAL STORAGE HELPERS FOR MOCK MODE ---
function getLocalUsers(): UserProfile[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("pulse_users");
  if (!stored) {
    localStorage.setItem("pulse_users", JSON.stringify(MOCK_PROFILES));
    return MOCK_PROFILES;
  }
  return JSON.parse(stored);
}

function saveLocalUsers(users: UserProfile[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("pulse_users", JSON.stringify(users));
  }
}

function getLocalWorkouts(userId: string): WorkoutExercise[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(`pulse_workouts_${userId}`);
  if (!stored) {
    // Initialize default workouts
    const initialWorkouts: WorkoutExercise[] = DEFAULT_WORKOUT_PLAN.map((item, idx) => ({
      id: `local_${userId}_${idx}`,
      userId,
      day: item.day,
      muscle: item.muscle,
      exercise: item.exercise,
      sets: item.sets,
      completed: false,
      updatedAt: new Date().toISOString(),
    }));
    localStorage.setItem(`pulse_workouts_${userId}`, JSON.stringify(initialWorkouts));
    return initialWorkouts;
  }
  return JSON.parse(stored);
}

function saveLocalWorkouts(userId: string, workouts: WorkoutExercise[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`pulse_workouts_${userId}`, JSON.stringify(workouts));
  }
}

// --- CORE SERVICES ---

export async function createUserProfile(uid: string, name: string, email: string): Promise<UserProfile> {
  if (!isFirebaseConfigured) {
    const profile: UserProfile = {
      uid,
      name,
      email,
      createdAt: new Date().toISOString(),
      streak: 0,
      completedCount: 0,
    };
    const localUsers = getLocalUsers();
    // Prevent duplicate entries
    const filtered = localUsers.filter((u) => u.uid !== uid);
    saveLocalUsers([...filtered, profile]);
    // Initialize local workouts
    getLocalWorkouts(uid);
    return profile;
  }

  const userRef = doc(db, "users", uid);
  const profile: UserProfile = {
    uid,
    name,
    email,
    createdAt: new Date().toISOString(),
    streak: 0,
    completedCount: 0,
  };
  await setDoc(userRef, profile);
  await initializeUserWorkouts(uid);
  return profile;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured) {
    const localUsers = getLocalUsers();
    const found = localUsers.find((u) => u.uid === uid);
    return found || null;
  }

  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  return null;
}

export async function getAllUserProfiles(): Promise<UserProfile[]> {
  if (!isFirebaseConfigured) {
    const localUsers = getLocalUsers();
    return [...localUsers].sort((a, b) => (b.completedCount || 0) - (a.completedCount || 0));
  }

  const usersColl = collection(db, "users");
  const snap = await getDocs(usersColl);
  const users: UserProfile[] = [];
  snap.forEach((doc) => {
    users.push(doc.data() as UserProfile);
  });
  return users.sort((a, b) => (b.completedCount || 0) - (a.completedCount || 0));
}

export async function initializeUserWorkouts(userId: string) {
  if (!isFirebaseConfigured) {
    getLocalWorkouts(userId);
    return;
  }

  const batch = writeBatch(db);
  DEFAULT_WORKOUT_PLAN.forEach((item) => {
    const cleanMuscle = item.muscle.replace(/[^a-zA-Z0-9]/g, "");
    const cleanExercise = item.exercise.replace(/[^a-zA-Z0-9]/g, "");
    const docId = `${userId}_${item.day}_${cleanMuscle}_${cleanExercise}`;
    const workoutRef = doc(db, "workouts", docId);
    
    const workout: WorkoutExercise = {
      userId,
      day: item.day,
      muscle: item.muscle,
      exercise: item.exercise,
      sets: item.sets,
      completed: false,
      updatedAt: new Date().toISOString(),
    };
    batch.set(workoutRef, workout);
  });
  await batch.commit();
}

export async function getUserWorkouts(userId: string): Promise<WorkoutExercise[]> {
  if (!isFirebaseConfigured) {
    return getLocalWorkouts(userId);
  }

  const q = query(collection(db, "workouts"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const workouts: WorkoutExercise[] = [];
  snap.forEach((doc) => {
    workouts.push({ id: doc.id, ...doc.data() } as WorkoutExercise);
  });

  if (workouts.length === 0) {
    await initializeUserWorkouts(userId);
    return getUserWorkouts(userId);
  }
  return workouts;
}

export async function toggleWorkoutExercise(
  userId: string,
  exerciseId: string,
  completed: boolean
) {
  if (!isFirebaseConfigured) {
    // 1. Toggle completion in local workouts list
    const workouts = getLocalWorkouts(userId);
    const updated = workouts.map((w) =>
      w.id === exerciseId
        ? { ...w, completed, updatedAt: new Date().toISOString() }
        : w
    );
    saveLocalWorkouts(userId, updated);

    // 2. Adjust completion count in user profile list
    const localUsers = getLocalUsers();
    const updatedUsers = localUsers.map((u) =>
      u.uid === userId
        ? {
            ...u,
            completedCount: Math.max(0, (u.completedCount || 0) + (completed ? 1 : -1)),
          }
        : u
    );
    saveLocalUsers(updatedUsers);
    return;
  }

  const exerciseRef = doc(db, "workouts", exerciseId);
  await updateDoc(exerciseRef, {
    completed,
    updatedAt: new Date().toISOString(),
  });

  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    completedCount: increment(completed ? 1 : -1),
  });
}

export async function updateUserStreak(userId: string, streak: number) {
  if (!isFirebaseConfigured) {
    const localUsers = getLocalUsers();
    const updatedUsers = localUsers.map((u) =>
      u.uid === userId ? { ...u, streak } : u
    );
    saveLocalUsers(updatedUsers);
    return;
  }

  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { streak });
}
