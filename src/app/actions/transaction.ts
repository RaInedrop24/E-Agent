'use server';

import { createClient } from '@supabase/supabase-js';
import { sendNotifications } from '@/lib/notifications';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/constants';

export async function toggleMilestone(
  transactionId: string, 
  milestoneId: string, 
  currentStatus: boolean
) {
  // 1. Authenticate User
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  
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
    .select('id, label_en, label_it') // Fetch id and label for notification
    .single();

  if (updateError) {
    return { error: updateError.message };
  }

  // 3. Check if this is the last uncompleted milestone
  const { data: allMilestones } = await supabase
    .from('milestones')
    .select('id, completed')
    .eq('transaction_id', transactionId);

  const isLastMilestone = newStatus && allMilestones?.every(m => m.id === milestoneId || m.completed);

  // 4. Update last_updated timestamp
  await supabase.rpc('update_transaction_last_updated', {
    p_transaction_id: transactionId
  });

  // 5. Send Notification (Async - don't await strictly if you want fast UI, but here we await to log errors)
  // We need the user's name for the "Updated by" field.
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
  const updatedByName = profile?.full_name || 'A user';

  // We intentionally do not await this to return UI response faster,
  // BUT in Server Actions, Vercel/Next might kill the process if we don't await.
  // Best practice in Server Actions is to await or use `waitUntil` (if on Vercel Edge).
  // We'll await for safety.
  await sendNotifications({
    transactionId,
    triggerUserId: user.id,
    type: 'MILESTONE_UPDATE',
    data: {
      milestoneId: milestone.id,
      milestoneTitle: milestone.label_en || milestone.label_it || 'Milestone',
      status: newStatus ? 'completed' : 'pending',
      updatedByName,
      isLastMilestone, // NEW: Flag for last milestone detection
    }
  });

  return { success: true };
}

export async function notifyFileUpload(
  transactionId: string,
  fileName: string,
  uploaderId: string
) {
  // 1. Authenticate User via cookie
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);

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
    await supabase.auth.setSession({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
    });

    // Fetch uploader's name
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', uploaderId).single();
    const uploaderName = profile?.full_name || 'A user';

    // Update last_updated timestamp
    await supabase.rpc('update_transaction_last_updated', {
      p_transaction_id: transactionId
    });

    // Send notifications
    await sendNotifications({
      transactionId,
      triggerUserId: uploaderId,
      type: 'FILE_UPLOAD',
      data: {
        fileName,
        uploaderName,
      }
    });

    return { success: true };
  } catch (error) {
    console.error('[notifyFileUpload] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to send notifications' };
  }
}

export async function notifyNewMessage(
  transactionId: string,
  authorId: string,
  messageContent: string
) {
  // 1. Authenticate User via cookie
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);

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
    await supabase.auth.setSession({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
    });

    // Fetch author's name
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', authorId).single();
    const authorName = profile?.full_name || 'A user';

    // Update last_updated timestamp
    await supabase.rpc('update_transaction_last_updated', {
      p_transaction_id: transactionId
    });

    // Send notifications
    await sendNotifications({
      transactionId,
      triggerUserId: authorId,
      type: 'NEW_MESSAGE',
      data: {
        authorName,
        content: messageContent,
      }
    });

    return { success: true };
  } catch (error) {
    console.error('[notifyNewMessage] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to send notifications' };
  }
}

export async function finalizeTransaction(transactionId: string) {
  // 1. Authenticate User
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);

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
    await supabase.auth.setSession({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: 'Unauthorized' };
    }

    // 2. Verify user is the transaction creator
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('created_by, status')
      .eq('id', transactionId)
      .single();

    if (txError || !transaction) {
      return { error: 'Transaction not found' };
    }

    if (transaction.created_by !== user.id) {
      return { error: 'Only the transaction creator can finalize' };
    }

    if (transaction.status === 'completed') {
      return { error: 'Transaction already finalized' };
    }

    // 3. Verify all milestones are complete
    const { data: milestones, error: milestonesError } = await supabase
      .from('milestones')
      .select('completed')
      .eq('transaction_id', transactionId);

    if (milestonesError) {
      return { error: 'Failed to check milestones' };
    }

    const allComplete = milestones?.every(m => m.completed) ?? false;
    if (!allComplete) {
      return { error: 'All milestones must be completed before finalizing' };
    }

    // 4. Update transaction status to 'completed'
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', transactionId);

    if (updateError) {
      return { error: updateError.message };
    }

    // 5. Fetch user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const agentName = profile?.full_name || 'Your agent';

    // 6. Send closing notifications
    await sendNotifications({
      transactionId,
      triggerUserId: user.id, // Agent doesn't get notified
      type: 'TRANSACTION_FINALIZED',
      data: {
        agentName,
      }
    });

    return { success: true };
  } catch (error) {
    console.error('[finalizeTransaction] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to finalize transaction' };
  }
}
