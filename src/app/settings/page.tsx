'use client';
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { getSupportedLanguages } from "@/lib/ui-translations";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SupportedLanguage } from "@/lib/translation";
import { Loader2 } from "lucide-react";
import { useBranding } from "@/contexts/BrandingContext";

interface BrandColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

const DEFAULT_COLORS: BrandColors = {
  primary: "#0f172a",
  secondary: "#64748b",
  background: "#f8fafc",
  text: "#334155"
};

const COUNTRY_CODES = [
  { code: "+1", country: "US/CA" },
  { code: "+44", country: "UK" },
  { code: "+39", country: "IT" },
  { code: "+33", country: "FR" },
  { code: "+49", country: "DE" },
  { code: "+34", country: "ES" },
  { code: "+48", country: "PL" },
  { code: "+353", country: "IE" },
];

export default function SettingsPage() {
  const { t: translate, tVar } = useLanguage();
  const { setBranding } = useBranding();
  const [role, setRole] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<SupportedLanguage>("en");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Branding State
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);
  const [brandColors, setBrandColors] = useState<BrandColors>(DEFAULT_COLORS);
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

  // Alerts State
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [countryCode, setCountryCode] = useState("+44");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Track original values to detect changes
  const [originalFullName, setOriginalFullName] = useState("");
  const [originalLanguage, setOriginalLanguage] = useState<SupportedLanguage>("en");
  const [originalBrandColors, setOriginalBrandColors] = useState<BrandColors>(DEFAULT_COLORS);
  const [originalBrandLogoUrl, setOriginalBrandLogoUrl] = useState<string | null>(null);
  const [originalEmailAlerts, setOriginalEmailAlerts] = useState(false);
  const [originalSmsAlerts, setOriginalSmsAlerts] = useState(false);
  const [originalFullPhone, setOriginalFullPhone] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const supportedLanguages = getSupportedLanguages();
  
  // Ensure component is mounted before rendering Select (fixes hydration mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Check if profile has been modified
  const currentFullPhone = smsAlerts ? `${countryCode}${phoneNumber}` : null;
  
  const hasProfileChanges = 
    fullName !== originalFullName || 
    preferredLanguage !== originalLanguage ||
    JSON.stringify(brandColors) !== JSON.stringify(originalBrandColors) ||
    brandLogoUrl !== originalBrandLogoUrl ||
    emailAlerts !== originalEmailAlerts ||
    smsAlerts !== originalSmsAlerts ||
    (smsAlerts && currentFullPhone !== originalFullPhone);

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
          setRole(profile.role);
          const name = profile.full_name || "";
          const lang = (profile.preferred_language as SupportedLanguage) || "en";
          const avatar = profile.avatar_url || null;
          
          setFullName(name);
          setOriginalFullName(name);
          setAvatarUrl(avatar);
          setOriginalAvatarUrl(avatar);
          setPreferredLanguage(lang);
          setOriginalLanguage(lang);

          // Load branding
          if (profile.branding_logo_url) {
            setBrandLogoUrl(profile.branding_logo_url);
            setOriginalBrandLogoUrl(profile.branding_logo_url);
          }
          if (profile.branding_settings) {
            const colors = { ...DEFAULT_COLORS, ...profile.branding_settings };
            setBrandColors(colors);
            setOriginalBrandColors(colors);
          }

          // Load alerts
          // Check if columns exist (might be undefined if migration hasn't run fully or caching)
          // We default to false for email if undefined (user request)
          setEmailAlerts(profile.email_alerts_enabled ?? false);
          setOriginalEmailAlerts(profile.email_alerts_enabled ?? false);
          
          setSmsAlerts(profile.sms_alerts_enabled ?? false);
          setOriginalSmsAlerts(profile.sms_alerts_enabled ?? false);

          if (profile.phone_number) {
            setOriginalFullPhone(profile.phone_number);
            // Parse country code (simple heuristic: first 2-4 chars)
            const phone = profile.phone_number;
            const foundCode = COUNTRY_CODES.find(c => phone.startsWith(c.code));
            if (foundCode) {
              setCountryCode(foundCode.code);
              setPhoneNumber(phone.substring(foundCode.code.length));
            } else {
              setPhoneNumber(phone);
            }
          }

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

      // Validation
      if (smsAlerts && !phoneNumber) {
        throw new Error("Phone number is required for SMS alerts");
      }
      
      // Strip leading zero from phone number if present
      const cleanPhone = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;
      const finalPhone = smsAlerts ? `${countryCode}${cleanPhone}` : null;

      // Update profile in database
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          preferred_language: preferredLanguage,
          branding_logo_url: brandLogoUrl,
          branding_settings: brandColors,
          email_alerts_enabled: emailAlerts,
          sms_alerts_enabled: smsAlerts,
          phone_number: finalPhone
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
      setOriginalBrandLogoUrl(brandLogoUrl);
      setOriginalBrandColors(brandColors);
      setOriginalEmailAlerts(emailAlerts);
      setOriginalSmsAlerts(smsAlerts);
      setOriginalFullPhone(finalPhone);
      
      // Update global branding context
      setBranding(brandLogoUrl, brandColors);
      
      if (languageChanged) {
        // Language changed - reload the page to apply UI translations
        setStatus("Profile saved! Reloading for language change...");
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
      const resized = await resizeImage(avatarFile, 128);
      const { data: session } = await supabase.auth.getUser();
      const uid = session.user?.id;
      if (!uid) throw new Error("Not authenticated");
      const path = `${uid}/${Date.now()}.webp`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, resized, {
        upsert: true,
        contentType: 'image/webp',
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = pub.publicUrl;
      
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', uid);

      if (updateErr) throw updateErr;

      setStatus("Avatar uploaded");
      setAvatarUrl(avatarUrl);
      setOriginalAvatarUrl(avatarUrl);
      // Refresh to propagate avatar
      setTimeout(() => window.location.reload(), 400);
    } catch (e: any) {
      setError(e?.message || "Failed to upload avatar");
    }
  };

  const onBrandLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBrandLogoFile(file);
  };

  const onUploadBrandLogo = async () => {
    setStatus(null);
    setError(null);
    setIsGeneratingTheme(true); // Re-using state for "Uploading"
    try {
      if (!supabase) throw new Error("Supabase not configured");
      if (!brandLogoFile) throw new Error("No file selected");

      const { data: session } = await supabase.auth.getUser();
      const uid = session.user?.id;
      if (!uid) throw new Error("Not authenticated");

      // Upload Logo
      const path = `${uid}/brand-logo-${Date.now()}`;
      const { error: upErr } = await supabase.storage.from('agency-branding').upload(path, brandLogoFile, {
        upsert: true,
      });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from('agency-branding').getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      setBrandLogoUrl(publicUrl);
      setStatus("Logo uploaded! You can now adjust your theme colors below.");

    } catch (e: any) {
      setError(e?.message || "Failed to upload brand logo");
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  // Resize helper
  const resizeImage = (file: File, targetSize = 128) => {
    return new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, targetSize, targetSize);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('Failed to create image blob')); return; }
          resolve(blob);
        }, 'image/webp', 0.9);
      };
      img.onerror = (err) => reject(err);
      img.src = URL.createObjectURL(file);
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-8 pb-20">
      <h1 className="text-2xl font-semibold">{translate('nav.settings')}</h1>

      <div className="grid gap-8">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>{translate('settings.profile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {email && <div className="text-sm text-muted-foreground">{tVar('settings.signedInAs', { email })}</div>}
            
            <div className="flex items-center gap-6">
               <div className="shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-16 w-16 rounded-full border object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">?</div>
                )}
               </div>
               <div className="space-y-2 flex-1">
                 <Label htmlFor="avatar">{translate('settings.avatar')}</Label>
                 <div className="flex gap-2">
                   <Input id="avatar" type="file" accept="image/*" onChange={onAvatarChange} className="max-w-xs" />
                   <Button variant="outline" onClick={onUploadAvatar} disabled={!avatarFile}>
                     {translate('settings.uploadAvatar')}
                   </Button>
                 </div>
               </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">{translate('form.fullName')}</Label>
                <Input id="full_name" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">{translate('form.language')}</Label>
                {mounted ? (
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
                ) : (
                  <div className="h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm flex items-center">
                    {supportedLanguages.find(l => l.code === preferredLanguage)?.nativeName || 'Select language'}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications / Alerts Section */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
            <CardDescription>
              Choose how you want to be notified about transaction updates (milestones, messages).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
               <div className="space-y-0.5">
                  <Label className="text-base">Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">Receive updates via email to {email}</p>
               </div>
               <Switch 
                 checked={emailAlerts}
                 onCheckedChange={setEmailAlerts}
               />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <div className="space-y-0.5">
                    <Label className="text-base">SMS Alerts</Label>
                    <p className="text-sm text-muted-foreground">Receive urgent updates via text message</p>
                 </div>
                 <Switch 
                   checked={smsAlerts}
                   onCheckedChange={setSmsAlerts}
                 />
              </div>
              
              {smsAlerts && (
                <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-1">
                   <div className="col-span-1">
                     {mounted ? (
                       <Select value={countryCode} onValueChange={setCountryCode}>
                          <SelectTrigger>
                             <SelectValue placeholder="Code" />
                          </SelectTrigger>
                          <SelectContent>
                             {COUNTRY_CODES.map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                   {c.country} ({c.code})
                                </SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                     ) : (
                       <div className="h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm flex items-center">
                         {COUNTRY_CODES.find(c => c.code === countryCode)?.code || 'Code'}
                       </div>
                     )}
                   </div>
                   <div className="col-span-2">
                     <Input 
                        placeholder="Phone Number (e.g. 712345678)" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        type="tel"
                     />
                   </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Brand Identity Section */}
        {role === 'agent' && (
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
              <CardDescription>
                Upload your agency logo to automatically generate a matching theme for your client portals and emails.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label>Agency Logo</Label>
                    <div className="flex gap-2">
                      <Input type="file" accept="image/*" onChange={onBrandLogoChange} />
                      <Button 
                        onClick={onUploadBrandLogo} 
                        disabled={!brandLogoFile || isGeneratingTheme}
                      >
                        {isGeneratingTheme ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                        ) : (
                          "Upload Logo"
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                     <div className="flex items-center justify-between">
                       <Label>Theme Colors</Label>
                       <Button 
                         variant="ghost" 
                         size="sm" 
                         className="h-8 text-xs text-muted-foreground hover:text-foreground"
                         onClick={() => setBrandColors(DEFAULT_COLORS)}
                       >
                         Reset to Defaults
                       </Button>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                         <Label className="text-xs">Primary</Label>
                         <div className="flex gap-2 items-center">
                           <input 
                             type="color" 
                             value={brandColors.primary} 
                             onChange={(e) => setBrandColors({...brandColors, primary: e.target.value})}
                             className="h-8 w-12 cursor-pointer border rounded"
                           />
                           <span className="text-xs font-mono">{brandColors.primary}</span>
                         </div>
                       </div>
                       <div className="space-y-1">
                         <Label className="text-xs">Secondary</Label>
                         <div className="flex gap-2 items-center">
                           <input 
                             type="color" 
                             value={brandColors.secondary} 
                             onChange={(e) => setBrandColors({...brandColors, secondary: e.target.value})}
                             className="h-8 w-12 cursor-pointer border rounded"
                           />
                           <span className="text-xs font-mono">{brandColors.secondary}</span>
                         </div>
                       </div>
                       <div className="space-y-1">
                         <Label className="text-xs">Background</Label>
                         <div className="flex gap-2 items-center">
                           <input 
                             type="color" 
                             value={brandColors.background} 
                             onChange={(e) => setBrandColors({...brandColors, background: e.target.value})}
                             className="h-8 w-12 cursor-pointer border rounded"
                           />
                           <span className="text-xs font-mono">{brandColors.background}</span>
                         </div>
                       </div>
                       <div className="space-y-1">
                         <Label className="text-xs">Text</Label>
                         <div className="flex gap-2 items-center">
                           <input 
                             type="color" 
                             value={brandColors.text} 
                             onChange={(e) => setBrandColors({...brandColors, text: e.target.value})}
                             className="h-8 w-12 cursor-pointer border rounded"
                           />
                           <span className="text-xs font-mono">{brandColors.text}</span>
                         </div>
                       </div>
                     </div>
                  </div>
                </div>

                {/* Preview Card */}
                <div className="w-full sm:w-64 shrink-0">
                  <Label className="mb-2 block">Live Preview</Label>
                  <div 
                    className="rounded-lg border shadow-sm p-4 flex flex-col items-center gap-3 text-center"
                    style={{ backgroundColor: brandColors.background }}
                  >
                    {brandLogoUrl ? (
                      <img src={brandLogoUrl} alt="Logo Preview" className="h-12 object-contain" />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">Logo</div>
                    )}
                    
                    <div className="space-y-1">
                      <h3 className="font-semibold text-sm" style={{ color: brandColors.text }}>Agent Portal</h3>
                      <p className="text-xs opacity-80" style={{ color: brandColors.text }}>Welcome back!</p>
                    </div>
                    
                    <button 
                      className="text-xs px-3 py-1.5 rounded-md font-medium text-white w-full"
                      style={{ backgroundColor: brandColors.primary }}
                    >
                      View Properties
                    </button>
                    <button 
                      className="text-xs px-3 py-1.5 rounded-md font-medium w-full border"
                      style={{ borderColor: brandColors.secondary, color: brandColors.secondary }}
                    >
                      Contact Agent
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle>{translate('settings.security')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{translate('form.newPassword')}</Label>
              <Input id="password" type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button onClick={onChangePassword} variant="outline">{translate('settings.changePassword')}</Button>
          </CardContent>
        </Card>

        {/* Global Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t flex justify-end gap-4 max-w-5xl mx-auto w-full z-10">
           {status && <div className="flex items-center text-sm text-green-600 mr-auto">{status}</div>}
           {error && <div className="flex items-center text-sm text-red-600 mr-auto">{error}</div>}
           
           <Button 
            onClick={onSaveProfile} 
            disabled={!hasProfileChanges || saving}
            size="lg"
            className="shadow-lg"
          >
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {translate('settings.saving')}</>
            ) : (
              translate('settings.saveProfile')
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
