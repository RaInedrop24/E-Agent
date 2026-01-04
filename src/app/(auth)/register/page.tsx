'use client';
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function RegisterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const role = "agent" as const; // Only agents can register via the site
  const [preferredLanguage, setPreferredLanguage] = useState<string>("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Don't render form if user is already logged in (will redirect)
  if (user) {
    return null;
  }

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
          <CardTitle>{t('auth.registerAsAgent')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">{t('form.fullName')}</Label>
            <Input id="full_name" type="text" placeholder="Alex Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('form.email')}</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('form.password')}</Label>
            <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {t('auth.agentOnlyNotice')}
          </p>
          <div className="space-y-2">
            <Label>{t('form.language')}</Label>
            <Select defaultValue="en" onValueChange={(v) => setPreferredLanguage(v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('landing.selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇬🇧 {t('lang.english')}</SelectItem>
                <SelectItem value="it">🇮🇹 {t('lang.italian')}</SelectItem>
                <SelectItem value="es">🇪🇸 {t('lang.spanish')}</SelectItem>
                <SelectItem value="fr">🇫🇷 {t('lang.french')}</SelectItem>
                <SelectItem value="de">🇩🇪 {t('lang.german')}</SelectItem>
                <SelectItem value="pl">🇵🇱 {t('lang.polish')}</SelectItem>
                <SelectItem value="nl">🇳🇱 Nederlands</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t('settings.languageDescription')}
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" type="button" onClick={onSubmit} disabled={loading}>
            {loading ? t('auth.creatingAccount') : t('auth.registerAsAgentButton')}
          </Button>
          <p className="text-sm text-muted-foreground">
            {t('auth.alreadyHaveAccount')}{" "}
            <Link className="underline" href="/login">
              {t('auth.signIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

