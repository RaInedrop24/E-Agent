import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupabaseDebugPage() {
  const isConfigured = Boolean(supabase);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "(not set)";

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>Configured: {isConfigured ? "Yes" : "No"}</div>
          <div>URL: {url}</div>
          {!isConfigured && (
            <div className="text-red-600">
              Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

