/**
 * Super-admin processing of GDPR deletion requests.
 *
 * GET  /api/super-admin/deletion-requests — list all requests (newest first)
 * POST /api/super-admin/deletion-requests — process one:
 *        { requestId, action: 'complete' | 'cancel' }
 *
 * 'complete' permanently deletes the auth user. The profiles row cascades
 * from auth.users; participant rows, associations, and notifications cascade
 * from profiles. Messages and files authored by the user are kept (author
 * set to NULL) because they are part of other participants' transaction
 * records. Storage objects under the user's folder in the avatars and
 * agency-branding buckets are removed best-effort.
 *
 * Transactions CREATED by the user block deletion (FK RESTRICT) — the admin
 * must delete or reassign them first; the route returns 409 with the count.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseAdmin, isSuperAdmin } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

async function requireSuperAdmin(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return { user: null, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!(await isSuperAdmin(user.id))) {
    return { user: null, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { user, response: null };
}

export async function GET(request: NextRequest) {
  const { user, response } = await requireSuperAdmin(request);
  if (!user) return response;

  const supabaseAdmin = getSupabaseAdmin();

  const { data: requests, error } = await supabaseAdmin
    .from('deletion_requests')
    .select('id, user_id, reason, status, requested_at, processed_at, processed_by')
    .order('requested_at', { ascending: false });

  if (error) {
    logger.error('[GDPR Admin] Failed to list deletion requests', { error: error.message });
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }

  // Attach requester name/email for display
  const enriched = await Promise.all(
    (requests ?? []).map(async (req) => {
      const [{ data: profile }, { data: authUser }] = await Promise.all([
        supabaseAdmin.from('profiles').select('full_name, role').eq('id', req.user_id).maybeSingle(),
        supabaseAdmin.auth.admin.getUserById(req.user_id),
      ]);
      return {
        ...req,
        full_name: profile?.full_name ?? null,
        role: profile?.role ?? null,
        email: authUser?.user?.email ?? null,
      };
    })
  );

  return NextResponse.json({ requests: enriched });
}

export async function POST(request: NextRequest) {
  const { user: admin, response } = await requireSuperAdmin(request);
  if (!admin) return response;

  const supabaseAdmin = getSupabaseAdmin();

  const body = await request.json().catch(() => null);
  const requestId = body?.requestId;
  const action = body?.action;

  if (typeof requestId !== 'string' || !['complete', 'cancel'].includes(action)) {
    return NextResponse.json(
      { error: 'requestId and action (complete|cancel) are required' },
      { status: 400 }
    );
  }

  const { data: deletionRequest, error: fetchError } = await supabaseAdmin
    .from('deletion_requests')
    .select('id, user_id, status')
    .eq('id', requestId)
    .maybeSingle();

  if (fetchError || !deletionRequest) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }
  if (deletionRequest.status !== 'pending') {
    return NextResponse.json({ error: 'Request is not pending' }, { status: 409 });
  }

  if (action === 'cancel') {
    await supabaseAdmin
      .from('deletion_requests')
      .update({
        status: 'cancelled',
        processed_at: new Date().toISOString(),
        processed_by: admin.id,
      })
      .eq('id', requestId);
    return NextResponse.json({ cancelled: true });
  }

  // action === 'complete'
  const userId = deletionRequest.user_id;

  // Transactions created by the user block deletion (FK RESTRICT)
  const { count: ownedTransactions } = await supabaseAdmin
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId);

  if ((ownedTransactions ?? 0) > 0) {
    return NextResponse.json(
      {
        error: `User owns ${ownedTransactions} transaction(s). Delete or reassign them before completing the deletion request.`,
        ownedTransactions,
      },
      { status: 409 }
    );
  }

  // Best-effort storage cleanup (files live under `${userId}/...`)
  for (const bucket of ['avatars', 'agency-branding']) {
    try {
      const { data: objects } = await supabaseAdmin.storage.from(bucket).list(userId);
      if (objects && objects.length > 0) {
        await supabaseAdmin.storage
          .from(bucket)
          .remove(objects.map((o) => `${userId}/${o.name}`));
      }
    } catch (storageError) {
      logger.warn('[GDPR Admin] Storage cleanup failed (continuing)', {
        bucket,
        userId,
        error: storageError instanceof Error ? storageError.message : String(storageError),
      });
    }
  }

  // Audit BEFORE deleting: the deletion_requests row cascades away with the user
  await supabaseAdmin.from('admin_audit_log').insert({
    admin_user_id: admin.id,
    action: 'gdpr_account_deletion',
    resource_type: 'user',
    resource_id: userId,
    details: { deletion_request_id: requestId },
  });

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (deleteError) {
    logger.error('[GDPR Admin] Failed to delete user', { userId, error: deleteError.message });
    return NextResponse.json({ error: `Deletion failed: ${deleteError.message}` }, { status: 500 });
  }

  logger.warn('[GDPR Admin] Account deleted', { userId, by: admin.id });
  return NextResponse.json({ deleted: true });
}
