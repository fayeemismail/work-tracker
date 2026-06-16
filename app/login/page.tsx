"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";
import { Dumbbell, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { user, login, loginWithGoogle, isConfigured } = useAuth();
  const { success, error } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!email || !password) {
      setFormError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      success("Welcome back!", "Login Successful");
      router.push("/dashboard");
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      console.error(firebaseError);
      let errMsg = "Unable to sign in. Please verify your details.";
      if (
        firebaseError.code === "auth/user-not-found" ||
        firebaseError.code === "auth/wrong-password" ||
        firebaseError.code === "auth/invalid-credential"
      ) {
        errMsg = "Invalid email or password.";
      } else if (firebaseError.code === "auth/invalid-email") {
        errMsg = "Please enter a valid email address.";
      }
      setFormError(errMsg);
      error(errMsg, "Sign In Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError("");
    setGoogleSubmitting(true);
    try {
      await loginWithGoogle();
      success("Welcome to Pulse!", "Google Sign In");
      router.push("/dashboard");
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      console.error(firebaseError);
      let errMsg = "Google authentication failed. Please try again.";
      if (firebaseError.code === "auth/popup-closed-by-user") {
        errMsg = "Sign in popup closed before completion.";
      }
      setFormError(errMsg);
      error(errMsg, "Sign In Failed");
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        
        {/* Brand Link */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Dumbbell className="h-4.5 w-4.5" />
            </div>
            <span className="text-base tracking-tight font-extrabold">PULSE</span>
          </Link>
        </div>

        {/* Credentials configuration notice */}
        {!isConfigured && (
          <div className="mb-4 p-4 rounded-lg bg-secondary/50 border border-border text-xs text-muted-foreground text-center">
            <strong>Running in Demo Mode:</strong> Firebase configuration is not defined. You can sign in instantly with mock data.
          </div>
        )}

        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-xl">Sign in to Pulse</CardTitle>
            <CardDescription>
              Enter your email below to access your workout plan
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Google Sign-in Option */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              loading={googleSubmitting}
              disabled={submitting || googleSubmitting}
              className="w-full justify-center text-sm font-semibold border-border hover:bg-muted/50 cursor-pointer"
            >
              {!googleSubmitting && (
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            {/* Separator Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <span className="absolute w-full border-t border-border" />
              <span className="relative bg-card px-3 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                Or email & password
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Error Banner */}
              {formError && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive font-medium">
                  {formError}
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting || googleSubmitting}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:opacity-50"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-xs font-semibold text-muted-foreground uppercase">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting || googleSubmitting}
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-border bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={submitting || googleSubmitting}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2 cursor-pointer"
                loading={submitting}
                disabled={submitting || googleSubmitting}
              >
                Sign In
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-foreground font-semibold ml-1 hover:underline">
              Sign Up
            </Link>
          </CardFooter>
        </Card>

      </div>
    </main>
  );
}
