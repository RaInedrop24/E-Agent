'use server';

import { createClient } from '@supabase/supabase-js';
import { sendNotifications } from '@/lib/notifications';
import { cookies } from 'next/headers';

export async function toggleMilestone(
  transactionId: string, 
  milestoneId: string, 
  currentStatus: boolean
) {
  // 1. Authenticate User
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('sb-skvfgvlwccxetglmfhpm-auth-token');
  
  if (!authCookie?.value) {
    return { error: 'Unauthorized: No session' };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  );

  try {
    const sessionData = JSON.parse(authCookie.value);
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
    });

    if (sessionError) {
      console.error('Session error:', sessionError);
      return { error: 'Unauthorized: Invalid session' };
    }
  } catch (e) {
    console.error('Cookie parse error:', e);
    return { error: 'Unauthorized: Malformed session' };
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  // 2. Perform Update
  const newStatus = !currentStatus;
  const completedAt = newStatus ? new Date().toISOString() : null;
  const completedBy = newStatus ? user.id : null;

  const { data: milestone, error: updateError } = await supabase
    .from('milestones')
    .update({
      completed: newStatus,
      completed_at: completedAt,
      completed_by: completedBy,
    })
    .eq('id', milestoneId)
    .select('label_en, label_it') // Fetch label for notification
    .single();

  if (updateError) {
    return { error: updateError.message };
  }

  // 3. Send Notification (Async - don't await strictly if you want fast UI, but here we await to log errors)
  // We need the user's name for the "Updated by" field.
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
  const updatedByName = profile?.full_name || 'A user';
  const milestoneTitle = milestone.label_en || milestone.label_it || 'Milestone';

  // We intentionally do not await this to return UI response faster, 
  // BUT in Server Actions, Vercel/Next might kill the process if we don't await. 
  // Best practice in Server Actions is to await or use `waitUntil` (if on Vercel Edge).
  // We'll await for safety.
  await sendNotifications({
    transactionId,
    triggerUserId: user.id,
    type: 'MILESTONE_UPDATE',
    data: {
      milestoneTitle,
      status: newStatus ? 'completed' : 'pending',
      updatedByName,
    }
  });

  return { success: true };
}
