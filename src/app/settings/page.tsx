'use client';
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { getSupportedLanguages } from "@/lib/ui-translations";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SupportedLanguage } from "@/lib/translation";

export default function SettingsPage() {
  const { t: translate, tVar } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<SupportedLanguage>("en");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Track original values to detect changes
  const [originalFullName, setOriginalFullName] = useState("");
  const [originalLanguage, setOriginalLanguage] = useState<SupportedLanguage>("en");
  
  const supportedLanguages = getSupportedLanguages();
  
  // Check if profile has been modified
  const hasProfileChanges = fullName !== originalFullName || preferredLanguage !== originalLanguage;

  // Load current profile data
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (!supabase) return;
        const { data: auth } = await supabase.auth.getUser();
        const u = auth.user;
        if (!u || !mounted) return;
        setEmail(u.email ?? null);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle();
        if (profile) {
          const name = profile.full_name || "";
          const lang = (profile.preferred_language as SupportedLanguage) || "en";
          setFullName(name);
          setOriginalFullName(name);
          setAvatarUrl(profile.avatar_url || null);
          setPreferredLanguage(lang);
          setOriginalLanguage(lang);
        } else if (u.user_metadata?.full_name) {
          setFullName(u.user_metadata.full_name);
          setOriginalFullName(u.user_metadata.full_name);
        }
      } catch {
        // ignore
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const onSaveProfile = async () => {
    setStatus(null);
    setError(null);
    setSaving(true);
    
    try {
      if (!supabase) throw new Error("Supabase not configured");
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) throw new Error("Not authenticated");
      
      const languageChanged = preferredLanguage !== originalLanguage;
      
      // Update profile in database (full_name and preferred_language)
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          preferred_language: preferredLanguage,
        })
        .eq('id', session.user.id);
      
      if (profileErr) throw profileErr;
      
      // Also update auth metadata for backward compatibility
      const { error: upErr } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      if (upErr) throw upErr;
      
      // Update original values
      setOriginalFullName(fullName);
      setOriginalLanguage(preferredLanguage);
      
      if (languageChanged) {
        // Language changed - reload the page to apply UI translations
        setStatus("Language updated! Reloading page...");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setStatus("Profile updated successfully!");
        setSaving(false);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to update profile");
      setSaving(false);
    }
  };

  const onChangePassword = async () => {
    setStatus(null);
    setError(null);
    try {
      if (!supabase) throw new Error("Supabase not configured");
      const { error: pwErr } = await supabase.auth.updateUser({ password });
      if (pwErr) throw pwErr;
      setStatus("Password changed");
      setPassword("");
    } catch (e: any) {
      setError(e?.message || "Failed to change password");
    }
  };

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatus(null);
    setError(null);
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
  };

  const onUploadAvatar = async () => {
    setStatus(null);
    setError(null);
    try {
      if (!supabase) throw new Error("Supabase not configured");
      if (!avatarFile) throw new Error("No file selected");
      const { data: session } = await supabase.auth.getUser();
      const uid = session.user?.id;
      if (!uid) throw new Error("Not authenticated");
      const ext = avatarFile.name.split('.').pop();
      const path = `${uid}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, {
        upsert: true,
        contentType: avatarFile.type,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = pub.publicUrl;
      const { error: profErr } = await supabase.from('profiles').upsert({
        id: uid,
        avatar_url: avatarUrl,
        full_name: fullName || undefined,
      }, { onConflict: 'id' });
      if (profErr) throw profErr;
      setStatus("Avatar uploaded");
    } catch (e: any) {
      setError(e?.message || "Failed to upload avatar");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">{translate('nav.settings')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{translate('settings.profile')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && <div className="text-sm text-muted-foreground">{tVar('settings.signedInAs', { email })}</div>}
          {avatarUrl && (
            <div className="flex items-center gap-3">
              <img src={avatarUrl} alt="Avatar" className="h-12 w-12 rounded-full border" />
              <span className="text-sm text-gray-600">Current avatar</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="full_name">{translate('form.fullName')}</Label>
            <Input id="full_name" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="language">{translate('form.language')}</Label>
            <Select value={preferredLanguage} onValueChange={(value) => setPreferredLanguage(value as SupportedLanguage)}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {translate('settings.languageDescription')}
            </p>
          </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">{translate('settings.avatar')}</Label>
              <Input id="avatar" type="file" accept="image/*" onChange={onAvatarChange} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={onUploadAvatar} disabled={!avatarFile}>{translate('settings.uploadAvatar')}</Button>
              </div>
              <p className="text-xs text-muted-foreground">{translate('settings.avatarNote')}</p>
            </div>
            <Button 
            onClick={onSaveProfile} 
            disabled={!hasProfileChanges || saving}
          >
            {saving ? translate('settings.saving') : translate('settings.saveProfile')}
          </Button>
          {!hasProfileChanges && !status && !error && (
            <p className="text-xs text-muted-foreground">
              {translate('settings.makeChanges')}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{translate('settings.security')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{translate('form.newPassword')}</Label>
            <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button onClick={onChangePassword}>{translate('settings.changePassword')}</Button>
        </CardContent>
      </Card>

      {status && <div className="text-sm text-green-600">{status}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}

