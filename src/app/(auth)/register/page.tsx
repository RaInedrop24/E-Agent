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
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, tVar } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
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

  const onSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error("Supabase is not configured. Check your .env.local.");
      }
      // Validate website URL if provided
      if (websiteUrl && websiteUrl.trim()) {
        try {
          const url = new URL(websiteUrl.trim());
          if (!['http:', 'https:'].includes(url.protocol)) {
            throw new Error("Website URL must start with http:// or https://");
          }
        } catch (e: any) {
          if (e.message.includes('Invalid URL')) {
            throw new Error("Please enter a valid website URL (e.g., https://example.com)");
          }
          throw e;
        }
      }

      // Don't use emailRedirectTo - it forces PKCE flow which requires code_verifier in sessionStorage
      // Without emailRedirectTo, Supabase uses token-based verification (token_hash) which works cross-device
      // Configure Site URL in Supabase dashboard to point to /auth/callback for redirects
      const signUpOptions = {
        email,
        password,
        options: {
          // emailRedirectTo removed to enable cross-device verification
          // Supabase will use Site URL from dashboard settings for redirect
          data: {
            full_name: fullName,
            role,
            preferred_language: preferredLanguage,
            website_url: websiteUrl.trim() || null,
          },
        },
      };
      const { error: signUpError, data } = await supabase.auth.signUp(signUpOptions);
      if (signUpError) throw signUpError;
      
      // Show success message
      toast.success(t('auth.registrationSuccess'), {
        description: tVar('auth.verificationEmailSent', { email }),
        duration: 5000,
      });
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (e: any) {
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
          <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="full_name">{t('form.fullName')}</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="Alex Doe"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('form.email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('form.password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder="********"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website_url">{t('form.websiteUrl')}</Label>
            <Input 
              id="website_url" 
              type="url" 
              placeholder={t('form.websiteUrlPlaceholder')} 
              autoComplete="url"
              value={websiteUrl} 
              onChange={(e) => setWebsiteUrl(e.target.value)} 
            />
            <p className="text-xs text-muted-foreground">
              {t('form.websiteUrlHelp')}
            </p>
          </div>
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
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? t('auth.creatingAccount') : t('auth.registerAsAgentButton')}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t('legal.registrationPrefix')}{' '}
            <Link className="underline" href="/terms">
              {t('legal.termsOfService')}
            </Link>{' '}
            {t('legal.registrationAnd')}{' '}
            <Link className="underline" href="/privacy">
              {t('legal.privacyPolicy')}
            </Link>
            .
          </p>
          <p className="text-sm text-muted-foreground">
            {t('auth.alreadyHaveAccount')}{" "}
            <Link className="underline" href="/login">
              {t('auth.signIn')}
            </Link>
          </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

