'use client';
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"agent" | "buyer">("buyer");
  const [preferredLanguage, setPreferredLanguage] = useState<string>("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    console.log("RegisterPage: onSubmit called");
    setError(null);
    setLoading(true);
    try {
      if (!supabase) {
        console.error("RegisterPage: Supabase is undefined");
        throw new Error("Supabase is not configured. Check your .env.local.");
      }
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const signUpOptions = {
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: fullName,
            role,
            preferred_language: preferredLanguage,
          },
        },
      };
      console.log("RegisterPage: Calling supabase.auth.signUp with", JSON.stringify(signUpOptions, null, 2));

      const { error: signUpError, data } = await supabase.auth.signUp(signUpOptions);
      console.log("RegisterPage: signUp returned", { signUpError, data });
      if (signUpError) throw signUpError;
      console.log("RegisterPage: Redirecting to dashboard");
      router.push("/dashboard");
    } catch (e: any) {
      console.error("RegisterPage: Error", e);
      setError(e?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" type="text" placeholder="Alex Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select defaultValue="buyer" onValueChange={(v) => setRole(v as "agent" | "buyer")}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="buyer">Buyer</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Agents create and manage transactions. Buyers view transactions they&apos;re invited to.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Preferred Language</Label>
            <Select defaultValue="en" onValueChange={(v) => setPreferredLanguage(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="it">Italiano (Italian)</SelectItem>
                <SelectItem value="de">Deutsch (German)</SelectItem>
                <SelectItem value="fr">Français (French)</SelectItem>
                <SelectItem value="es">Español (Spanish)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This will be used for UI and message translations (coming soon).
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" type="button" onClick={onSubmit} disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="underline" href="/login">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

