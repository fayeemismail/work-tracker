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
