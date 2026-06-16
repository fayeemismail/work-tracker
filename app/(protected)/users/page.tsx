"use client";

import React, { useEffect, useState } from "react";
import { UserCard } from "@/components/UserCard";
import { UserProfile } from "@/types";
import { getAllUserProfiles } from "@/services/db";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";
import { Users, Search } from "lucide-react";

export default function Community() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await getAllUserProfiles();
        setUsers(data);
      } catch (err) {
        console.error("Failed to load community users:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-muted-foreground" />
            Community
          </h1>
          <p className="text-sm text-muted-foreground">
            Explore fellow trainers, active streaks, and current week completion rates.
          </p>
        </div>

        {/* Minimal Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search trainers by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring"
          />
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        /* Skeletons */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-40 bg-secondary animate-pulse rounded-xl" />
          <div className="h-40 bg-secondary animate-pulse rounded-xl" />
          <div className="h-40 bg-secondary animate-pulse rounded-xl" />
        </div>
      ) : filteredUsers.length === 0 ? (
        /* Empty State */
        <Card className="border border-dashed border-border bg-secondary/15 py-16 text-center rounded-2xl flex flex-col items-center gap-3">
          <CardTitle className="text-base font-bold text-foreground">
            {searchQuery ? "No trainers match your search" : "No community members found"}
          </CardTitle>
          <CardDescription className="max-w-xs mx-auto text-xs text-muted-foreground">
            {searchQuery
              ? "Try double checking the spelling or searching for another user name."
              : "Looks like you are the first member to join! Invite others to start tracking together."}
          </CardDescription>
        </Card>
      ) : (
        /* Users Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredUsers.map((profile) => (
            <UserCard key={profile.uid} profile={profile} />
          ))}
        </div>
      )}

    </div>
  );
}
