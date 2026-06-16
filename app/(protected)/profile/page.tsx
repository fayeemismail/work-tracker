"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ProfileCard } from "@/components/ProfileCard";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Trash2, AlertTriangle, ShieldAlert, X, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { clearDatabaseCache } from "@/services/db";

export default function ProfilePage() {
  const { profile, deleteAccount, logout } = useAuth();
  const { success, error, info } = useToast();
  const router = useRouter();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  const handleClearCache = async () => {
    if (window.confirm("Are you sure you want to clear the database cache and offline storage? You will be signed out.")) {
      setClearingCache(true);
      try {
        await clearDatabaseCache();
        success("Offline cache and storage have been cleared. Redirecting...", "Cache Cleared");
        await logout();
        router.push("/login");
      } catch (err) {
        console.error("Failed to clear database cache:", err);
        error("Failed to clear database cache. Please try again.", "Action Failed");
      } finally {
        setClearingCache(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      success("Your account and data have been permanently deleted.", "Account Deleted");
      setShowConfirmModal(false);
      router.push("/");
    } catch (err: unknown) {
      console.error(err);
      const firebaseError = err as { code?: string; message?: string };
      
      let errMsg = "Could not delete your account. Please try again.";
      if (firebaseError.code === "auth/requires-recent-login") {
        errMsg = "For security, account deletion requires a recent login. Please sign out, sign back in, and retry.";
        info("Please log in again before deleting your account.", "Security Check");
      }
      error(errMsg, "Action Failed");
    } finally {
      setDeleting(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="flex flex-col gap-6 md:gap-8 max-w-2xl mx-auto">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
          Profile Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your training profile credentials and data settings.
        </p>
      </div>

      {/* User Information Profile Summary Card */}
      <ProfileCard profile={profile} />

      {/* Settings Options Card */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">General Info</CardTitle>
          <CardDescription>Review your active email credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between border-b border-border/50 pb-3 text-sm">
            <span className="text-muted-foreground font-medium">Display Name</span>
            <strong className="text-foreground">{profile.name}</strong>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between border-b border-border/50 pb-3 text-sm">
            <span className="text-muted-foreground font-medium">Email Address</span>
            <strong className="text-foreground">{profile.email}</strong>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between pb-1 text-sm">
            <span className="text-muted-foreground font-medium">Database Status</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              Synced / Active
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border border-red-500/20 bg-red-500/5 rounded-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <ShieldAlert className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-600/80 dark:text-red-400/80 text-xs">
            Irreversible actions regarding your workout statistics and account data
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
            <div className="max-w-md">
              <h4 className="text-sm font-bold text-foreground">Reset & Clear Cache</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Removes all local storage mock profiles/workouts and clears the browser's Firestore IndexedDB persistent offline database cache. You will be signed out.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              loading={clearingCache}
              onClick={handleClearCache}
              className="flex-shrink-0 gap-1.5 cursor-pointer text-red-500 border-red-500/20 hover:bg-red-500/5 hover:text-red-600"
            >
              <RefreshCw className="h-4 w-4" />
              Reset & Clear Cache
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="max-w-md">
              <h4 className="text-sm font-bold text-foreground">Delete Account</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Permanently remove your account, profile details, daily streaks, and all logged workout completion tables. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowConfirmModal(true)}
              className="flex-shrink-0 gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal Overlay */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-card border border-border p-6 rounded-2xl shadow-xl flex flex-col gap-4 animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <button
                onClick={() => !deleting && setShowConfirmModal(false)}
                disabled={deleting}
                className="p-1 hover:bg-muted rounded-lg transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">Delete account permanently?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you absolutely sure? This will permanently delete your user profile, weekly streaks, and all 24 workout routine documents. Your data will be deleted forever.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 border-t border-border pt-4 mt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
                disabled={deleting}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="cursor-pointer gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                Yes, Delete My Account
              </Button>
            </div>

          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

    </div>
  );
}
