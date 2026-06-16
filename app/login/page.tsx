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
  const { user, login, isConfigured } = useAuth();
  const { success, error } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

        {/* Credentials configuration notice if environment is empty */}
        {!isConfigured && (
          <div className="mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
            <strong>Firebase configuration missing:</strong> Please configure your credentials inside a `.env.local` file at the root. Use `.env.example` as a starting guide.
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
                  disabled={submitting || !isConfigured}
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
                    disabled={submitting || !isConfigured}
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-border bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={submitting || !isConfigured}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                loading={submitting}
                disabled={submitting || !isConfigured}
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
