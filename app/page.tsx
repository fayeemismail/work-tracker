"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Dumbbell, Flame, CheckSquare, Users, Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="flex-1 flex flex-col justify-center items-center bg-background text-foreground py-12 md:py-24 px-4 md:px-8">
      <div className="max-w-4xl w-full text-center flex flex-col items-center gap-6 md:gap-8">
        
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-muted-foreground border border-border animate-fade-in">
          <Sparkles className="h-3 w-3 text-amber-500 fill-amber-500/10" />
          <span>Now in open beta</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground max-w-2xl leading-[1.1] animate-fade-in-up">
          Track workouts. Build strength. Maintain focus.
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base md:text-lg text-muted-foreground max-w-xl leading-relaxed animate-fade-in-up">
          A minimalist workout tracker designed for focus. Organize your routine, log exercises in 1-tap, and view community progress.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center mt-2">
          <Link href={user ? "/dashboard" : "/signup"} className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full gap-2">
              {user ? "Go to Dashboard" : "Start Training Free"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/users" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full gap-2">
              <Users className="h-4 w-4" />
              Explore Community
            </Button>
          </Link>
        </div>

        {/* Features Preview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-4xl mt-12 md:mt-20 text-left">
          
          <div className="p-6 rounded-xl border border-border bg-card shadow-xs hover:border-foreground/10 transition-colors">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-secondary text-foreground mb-4">
              <Dumbbell className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base mb-1 text-foreground">Predefined Split</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mon-Sat structured routine targeting key muscle groups with balanced set counts. No planning needed.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card shadow-xs hover:border-foreground/10 transition-colors">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-secondary text-foreground mb-4">
              <CheckSquare className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-base mb-1 text-foreground">1-Tap Log</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Log exercise sets checking items off as you go. Updates and persists in Firestore in real-time.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card shadow-xs hover:border-foreground/10 transition-colors sm:col-span-2 md:col-span-1">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-secondary text-foreground mb-4">
              <Flame className="h-5 w-5 text-amber-500 fill-amber-500/10" />
            </div>
            <h3 className="font-semibold text-base mb-1 text-foreground">Streak Accountability</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Maintain active daily streaks by finishing your daily routine. Share and compare logs with community peers.
            </p>
          </div>

        </div>

      </div>
    </main>
  );
}
