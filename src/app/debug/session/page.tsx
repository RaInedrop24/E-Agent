'use client';
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SessionDebugPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Checking session...");

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!supabase) {
        setStatus("Supabase client not configured. Set env and restart.");
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      if (data.user) {
        setUserEmail(data.user.email ?? "(no email)");
        setStatus("Authenticated");
      } else {
        setUserEmail(null);
        setStatus("Not authenticated");
      }
      supabase.auth.onAuthStateChange(async () => {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        if (data.user) {
          setUserEmail(data.user.email ?? "(no email)");
          setStatus("Authenticated");
        } else {
          setUserEmail(null);
          setStatus("Not authenticated");
        }
      });
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Session Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>Status: {status}</div>
          <div>User: {userEmail ?? "(none)"}</div>
          <div className="pt-2">
            <Button onClick={signOut} variant="outline">Sign out</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

