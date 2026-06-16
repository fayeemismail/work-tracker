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
  deleteDoc,
  addDoc,
  clearIndexedDbPersistence,
  getDocsFromServer,
  getDocFromServer,
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
      completedSets: new Array(item.sets).fill(false), // Set completion status for each set
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
  const snap = await getDocFromServer(userRef);
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
  const snap = await getDocsFromServer(usersColl);
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
      completedSets: new Array(item.sets).fill(false), // Initialize with false flags
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
  const snap = await getDocsFromServer(q);
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

export async function updateWorkoutSets(
  userId: string,
  exerciseId: string,
  completedSets: boolean[],
  sets: number
) {
  const isCompleted = completedSets.length > 0 && completedSets.every((s) => s === true);

  if (!isFirebaseConfigured) {
    const workoutsList = getLocalWorkouts(userId);
    const exerciseIndex = workoutsList.findIndex((w) => w.id === exerciseId);
    if (exerciseIndex === -1) return;

    const target = workoutsList[exerciseIndex];
    const wasCompleted = target.completed;

    workoutsList[exerciseIndex] = {
      ...target,
      sets,
      completedSets,
      completed: isCompleted,
      updatedAt: new Date().toISOString(),
    };
    saveLocalWorkouts(userId, workoutsList);

    if (wasCompleted !== isCompleted) {
      const localUsers = getLocalUsers();
      const updatedUsers = localUsers.map((u) =>
        u.uid === userId
          ? {
              ...u,
              completedCount: Math.max(0, (u.completedCount || 0) + (isCompleted ? 1 : -1)),
            }
          : u
      );
      saveLocalUsers(updatedUsers);
    }
    return;
  }

  const exerciseRef = doc(db, "workouts", exerciseId);
  const exerciseSnap = await getDoc(exerciseRef);
  if (!exerciseSnap.exists()) return;

  const data = exerciseSnap.data() as WorkoutExercise;
  const wasCompleted = data.completed;

  await updateDoc(exerciseRef, {
    sets,
    completedSets,
    completed: isCompleted,
    updatedAt: new Date().toISOString(),
  });

  if (wasCompleted !== isCompleted) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      completedCount: increment(isCompleted ? 1 : -1),
    });
  }
}

export async function addCustomWorkoutExercise(
  userId: string,
  day: string,
  muscle: string,
  exerciseName: string,
  sets: number
): Promise<WorkoutExercise> {
  const completedSets = new Array(sets).fill(false);
  const workout: WorkoutExercise = {
    userId,
    day,
    muscle,
    exercise: exerciseName,
    sets,
    completed: false,
    completedSets,
    updatedAt: new Date().toISOString(),
  };

  if (!isFirebaseConfigured) {
    const workoutsList = getLocalWorkouts(userId);
    const mockId = `local_custom_${userId}_${Math.random().toString(36).substring(2, 9)}`;
    const fullWorkout = { id: mockId, ...workout };
    
    workoutsList.push(fullWorkout);
    saveLocalWorkouts(userId, workoutsList);
    return fullWorkout;
  }

  const workoutsColl = collection(db, "workouts");
  const docRef = await addDoc(workoutsColl, workout);
  return { id: docRef.id, ...workout };
}

export async function deleteWorkoutExercise(userId: string, exerciseId: string) {
  if (!isFirebaseConfigured) {
    const workoutsList = getLocalWorkouts(userId);
    const target = workoutsList.find((w) => w.id === exerciseId);
    if (!target) return;

    const updated = workoutsList.filter((w) => w.id !== exerciseId);
    saveLocalWorkouts(userId, updated);

    if (target.completed) {
      const localUsers = getLocalUsers();
      const updatedUsers = localUsers.map((u) =>
        u.uid === userId
          ? {
              ...u,
              completedCount: Math.max(0, (u.completedCount || 0) - 1),
            }
          : u
      );
      saveLocalUsers(updatedUsers);
    }
    return;
  }

  const exerciseRef = doc(db, "workouts", exerciseId);
  const exerciseSnap = await getDoc(exerciseRef);
  if (!exerciseSnap.exists()) return;

  const data = exerciseSnap.data() as WorkoutExercise;
  const wasCompleted = data.completed;

  await deleteDoc(exerciseRef);

  if (wasCompleted) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      completedCount: increment(-1),
    });
  }
}

export async function deleteUserProfileAndData(userId: string) {
  if (!isFirebaseConfigured) {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`pulse_workouts_${userId}`);
      const localUsers = getLocalUsers();
      saveLocalUsers(localUsers.filter((u) => u.uid !== userId));
    }
    return;
  }

  const userRef = doc(db, "users", userId);
  await deleteDoc(userRef);

  const q = query(collection(db, "workouts"), where("userId", "==", userId));
  const snap = await getDocs(q);
  
  const batch = writeBatch(db);
  snap.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

export async function toggleWorkoutExercise(
  userId: string,
  exerciseId: string,
  completed: boolean
) {
  const workouts = await getUserWorkouts(userId);
  const exercise = workouts.find((w) => w.id === exerciseId);
  if (exercise) {
    const setsList = new Array(exercise.sets).fill(completed);
    await updateWorkoutSets(userId, exerciseId, setsList, exercise.sets);
  }
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

export async function clearDatabaseCache() {
  if (isFirebaseConfigured && db) {
    try {
      await clearIndexedDbPersistence(db);
    } catch (err) {
      console.error("Failed to clear Firestore IndexedDB cache:", err);
    }
  }

  if (typeof window !== "undefined") {
    // Clear local storage profiles
    localStorage.removeItem("pulse_users");
    
    // Find all pulse_workouts_* and pulse_demo_* keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("pulse_workouts_") || key.startsWith("pulse_demo_"))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }
}
