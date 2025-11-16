'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<string>("Confirming your account...");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function check() {
      if (!supabase) {
        setStatus("Supabase not configured. Check .env.local and restart.");
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      if (data.user) {
        setEmail(data.user.email ?? null);
        setStatus("Your email has been confirmed.");
      } else {
        setStatus("Email confirmation complete. Please sign in.");
      }
    }
    check();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Estate Portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">{status}</div>
          {email && <div className="text-sm text-muted-foreground">Signed in as {email}</div>}
          <div className="flex gap-2 pt-2">
            <Button asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

