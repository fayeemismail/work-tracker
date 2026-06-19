"use server";

import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function initAdmin() {
  if (getApps().length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (privateKey && clientEmail && projectId) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
    }
  }
}

export async function cleanupStaleUsers(): Promise<{ success: boolean; deletedCount: number; message: string }> {
  initAdmin();
  
  if (getApps().length === 0) {
    return {
      success: false,
      deletedCount: 0,
      message: "Firebase Admin credentials are not configured in environment variables. Please add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to your .env file to enable this sync.",
    };
  }

  try {
    const db = getFirestore();
    const usersSnap = await db.collection("users").get();
    let deletedCount = 0;

    for (const doc of usersSnap.docs) {
      const uid = doc.id;
      // Skip mock profiles
      if (uid.startsWith("mock-") || uid.startsWith("local_") || uid.startsWith("demo_")) {
        continue;
      }

      try {
        await getAuth().getUser(uid);
        
        // Active user found: Recalculate and sync their profile stats!
        const workoutsSnap = await db.collection("workouts").where("userId", "==", uid).get();
        const workouts = workoutsSnap.docs.map((wDoc) => wDoc.data());
        
        if (workouts.length > 0) {
          const totalWorkouts = workouts.length;
          const completedCount = workouts.filter((w) => w.completed).length;
          
          // Day-averaged weekly progress calculation
          const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
          const dayProgresses: Record<string, number> = {};
          
          days.forEach((day) => {
            if (day === "Sunday") {
              dayProgresses[day] = 100;
              return;
            }
            
            const dayWorkouts = workouts.filter((w) => w.day === day);
            if (dayWorkouts.length === 0) {
              dayProgresses[day] = 100;
              return;
            }
            
            const muscleGroups: Record<string, boolean> = {};
            dayWorkouts.forEach((w) => {
              if (w.muscle) {
                if (muscleGroups[w.muscle] === undefined) {
                  muscleGroups[w.muscle] = true;
                }
                if (!w.completed) {
                  muscleGroups[w.muscle] = false;
                }
              }
            });
            
            const uniqueMuscles = Object.keys(muscleGroups);
            if (uniqueMuscles.length === 0) {
              dayProgresses[day] = 100;
              return;
            }
            
            const completedMusclesCount = uniqueMuscles.filter((m) => muscleGroups[m]).length;
            const progress = Math.min(100, Math.round((completedMusclesCount / 2) * 100));
            dayProgresses[day] = progress;
          });
          
          const sum = Object.values(dayProgresses).reduce((acc, val) => acc + val, 0);
          const weeklyProgress = Math.round(sum / 7);

          // Recalculate streak
          const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
          const dayCompleted: Record<string, boolean> = {};
          daysOrder.forEach((d) => {
            const dw = workouts.filter((w) => w.day === d);
            dayCompleted[d] = dw.length > 0 && dw.every((w) => w.completed);
          });
          
          const todayName = days[new Date().getDay()];
          let todayIdx = daysOrder.indexOf(todayName);
          if (todayIdx === -1) {
            todayIdx = 5; // Saturday
          }
          let streak = 0;
          for (let i = todayIdx; i >= 0; i--) {
            const d = daysOrder[i];
            if (dayCompleted[d]) {
              streak++;
            } else {
              if (i === todayIdx) continue;
              break;
            }
          }
          
          // Get current profile to get/calculate bestStreak
          const userDocRef = db.collection("users").doc(uid);
          const userDoc = await userDocRef.get();
          let bestStreak = streak;
          if (userDoc.exists) {
            const uData = userDoc.data();
            bestStreak = Math.max(uData?.bestStreak || 0, streak);
          }

          await userDocRef.update({
            totalWorkouts,
            completedCount,
            weeklyProgress,
            streak,
            bestStreak,
          });
        }
      } catch (err: any) {
        if (err.code === "auth/user-not-found") {
          // Delete user document from Firestore users collection
          await db.collection("users").doc(uid).delete();
          
          // Delete user's workouts
          const workoutsSnap = await db.collection("workouts").where("userId", "==", uid).get();
          const batch = db.batch();
          workoutsSnap.forEach((wDoc) => {
            batch.delete(wDoc.ref);
          });
          await batch.commit();
          
          deletedCount++;
        } else {
          console.error(`Error checking auth for UID ${uid}:`, err);
        }
      }
    }

    return {
      success: true,
      deletedCount,
      message: `Sync complete. Cleaned up ${deletedCount} stale user profile(s) that were not present in Firebase Auth.`,
    };
  } catch (error: any) {
    console.error("Failed to run stale users cleanup:", error);
    return {
      success: false,
      deletedCount: 0,
      message: error.message || "Failed to cleanup stale users.",
    };
  }
}

export async function deleteUserAccountAdmin(uid: string): Promise<{ success: boolean; message: string }> {
  initAdmin();
  if (getApps().length === 0) {
    return {
      success: false,
      message: "Firebase Admin is not configured. Falling back to client-side deletion.",
    };
  }

  try {
    const db = getFirestore();
    
    // Delete workouts from Firestore
    const workoutsSnap = await db.collection("workouts").where("userId", "==", uid).get();
    const batch = db.batch();
    workoutsSnap.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Delete user profile from Firestore
    await db.collection("users").doc(uid).delete();

    // Delete from Firebase Auth
    await getAuth().deleteUser(uid);

    return { success: true, message: "User deleted successfully via Admin SDK." };
  } catch (error: any) {
    console.error("Admin failed to delete user:", error);
    return { success: false, message: error.message || "Failed to delete user." };
  }
}

export async function isEmailAdmin(email: string): Promise<boolean> {
  const adminEmailsStr = process.env.ADMIN_EMAILS || "";
  const adminEmails = adminEmailsStr.split(",").map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

export async function checkAndRegisterAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; isCreated: boolean }> {
  const cleanEmail = email.toLowerCase();
  
  // Verify email is in admin emails list
  const adminEmailsStr = process.env.ADMIN_EMAILS || "";
  const adminEmails = adminEmailsStr.split(",").map((e) => e.trim().toLowerCase());
  
  if (!adminEmails.includes(cleanEmail)) {
    return { success: false, isCreated: false };
  }

  // Get admin passwords from environment variables
  const adminPasswordsMap: Record<string, string> = {
    "faheemmuhammed703@gmail.com": process.env.ADMIN_PASSWORD_FAHEEM || "Faheem",
    "faheemmhuhammed703@gmail.com": process.env.ADMIN_PASSWORD_FAHEEM || "Faheem",
    "adminfatracker@gmail.com": process.env.ADMIN_PASSWORD_FATRACKER || "faTracker26",
  };

  const expectedPassword = adminPasswordsMap[cleanEmail];
  if (!expectedPassword || password !== expectedPassword) {
    return { success: false, isCreated: false };
  }

  // Check if we should register the user in Firebase Auth using Admin SDK
  initAdmin();
  if (getApps().length > 0) {
    try {
      const auth = getAuth();
      try {
        await auth.getUserByEmail(cleanEmail);
      } catch (err: any) {
        if (err.code === "auth/user-not-found") {
          // Auto register on the server!
          const userRecord = await auth.createUser({
            email: cleanEmail,
            password: expectedPassword,
            displayName: cleanEmail === "adminfatracker@gmail.com" ? "Admin FaTracker" : "Admin Faheem",
          });

          // Initialize profile in Firestore
          const db = getFirestore();
          await db.collection("users").doc(userRecord.uid).set({
            uid: userRecord.uid,
            name: userRecord.displayName || "Admin",
            email: cleanEmail,
            createdAt: new Date().toISOString(),
            streak: 0,
            bestStreak: 0,
            completedCount: 0,
          });

          return { success: true, isCreated: true };
        }
      }
    } catch (error) {
      console.error("Error auto-registering admin on server:", error);
    }
  }

  return { success: true, isCreated: false };
}
