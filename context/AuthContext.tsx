"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  deleteUser,
  User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { UserProfile } from "@/types";
import { createUserProfile, getUserProfile, getAllUserProfiles, deleteUserProfileAndData } from "@/services/db";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (user) {
      try {
        const userProf = await getUserProfile(user.uid);
        setProfile(userProf);
      } catch (err) {
        console.error("Error refreshing user profile:", err);
      }
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Demo Mode Session Sync
      const timer = setTimeout(async () => {
        const storedUid = typeof window !== "undefined" ? localStorage.getItem("pulse_demo_logged_in_uid") : null;
        if (storedUid) {
          try {
            const prof = await getUserProfile(storedUid);
            if (prof) {
              setUser({
                uid: prof.uid,
                displayName: prof.name,
                email: prof.email,
              } as unknown as User);
              setProfile(prof);
            } else {
              localStorage.removeItem("pulse_demo_logged_in_uid");
            }
          } catch (e) {
            console.error("Failed to load local storage profile session:", e);
          }
        }
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userProf = await getUserProfile(currentUser.uid);
          setProfile(userProf);
        } catch (err) {
          console.error("Error loading user profile:", err);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email: string, password: string, name: string) => {
    if (!isFirebaseConfigured) {
      const mockUid = "demo_" + Math.random().toString(36).substring(2, 9);
      const userProf = await createUserProfile(mockUid, name, email);
      
      setUser({
        uid: mockUid,
        displayName: name,
        email: email,
      } as unknown as User);
      setProfile(userProf);
      localStorage.setItem("pulse_demo_logged_in_uid", mockUid);
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const fireUser = userCredential.user;
    await updateProfile(fireUser, { displayName: name });
    const userProf = await createUserProfile(fireUser.uid, name, email);
    setProfile(userProf);
    setUser(fireUser);
  };

  const login = async (email: string, password: string) => {
    if (!isFirebaseConfigured) {
      const resolvedUsers = await getAllUserProfiles();
      let found = resolvedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      
      if (!found) {
        // Auto-create profile so sign-in always succeeds during local tests
        const mockUid = "demo_" + Math.random().toString(36).substring(2, 9);
        const name = email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1);
        found = await createUserProfile(mockUid, name, email);
      }
      
      setUser({
        uid: found.uid,
        displayName: found.name,
        email: found.email,
      } as unknown as User);
      setProfile(found);
      localStorage.setItem("pulse_demo_logged_in_uid", found.uid);
      return;
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const fireUser = userCredential.user;
    const userProf = await getUserProfile(fireUser.uid);
    setProfile(userProf);
    setUser(fireUser);
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      const mockUid = "demo_google_" + Math.random().toString(36).substring(2, 9);
      const name = "Google Trainer " + Math.random().toString(36).substring(2, 5).toUpperCase();
      const email = "google.demo@example.com";
      const userProf = await createUserProfile(mockUid, name, email);
      
      setUser({
        uid: mockUid,
        displayName: name,
        email: email,
      } as unknown as User);
      setProfile(userProf);
      localStorage.setItem("pulse_demo_logged_in_uid", mockUid);
      return;
    }

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const fireUser = result.user;

    const existingProfile = await getUserProfile(fireUser.uid);
    if (!existingProfile) {
      const userProf = await createUserProfile(
        fireUser.uid,
        fireUser.displayName || "Google Trainer",
        fireUser.email || "google@example.com"
      );
      setProfile(userProf);
    } else {
      setProfile(existingProfile);
    }
    setUser(fireUser);
  };

  const logout = async () => {
    if (!isFirebaseConfigured) {
      localStorage.removeItem("pulse_demo_logged_in_uid");
      setUser(null);
      setProfile(null);
      return;
    }
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const deleteAccount = async () => {
    if (!user) return;
    
    const userId = user.uid;
    // 1. Delete data from DB
    await deleteUserProfileAndData(userId);

    // 2. Delete user from auth
    if (isFirebaseConfigured) {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await deleteUser(currentUser);
      }
    } else {
      localStorage.removeItem("pulse_demo_logged_in_uid");
    }

    // 3. Reset states
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isConfigured: isFirebaseConfigured,
        signup,
        login,
        loginWithGoogle,
        logout,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
