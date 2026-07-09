/**
 * GDPR Account Deletion Requests (Art. 17 — right to erasure)
 *
 * GET    /api/gdpr/delete-request  — current request status for the caller
 * POST   /api/gdpr/delete-request  — file a deletion request
 * DELETE /api/gdpr/delete-request  — cancel a pending request
 *
 * During the pilot, requests are processed manually by a super admin
 * (see /api/super-admin/deletion-requests) rather than deleting instantly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('deletion_requests')
    .select('id, status, reason, requested_at')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .maybeSingle();

  if (error) {
    logger.error('[GDPR] Failed to fetch deletion request', { error: error.message });
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }

  return NextResponse.json({ request: data ?? null });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let reason: string | null = null;
  try {
    const body = await request.json();
    if (typeof body?.reason === 'string' && body.reason.trim().length > 0) {
      reason = body.reason.trim().slice(0, 1000);
    }
  } catch {
    // No/invalid body is fine — reason is optional
  }

  const { data, error } = await getSupabaseAdmin()
    .from('deletion_requests')
    .insert({ user_id: user.id, reason })
    .select('id, status, requested_at')
    .single();

  if (error) {
    // Partial unique index violation → request already pending
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'A deletion request is already pending' },
        { status: 409 }
      );
    }
    logger.error('[GDPR] Failed to create deletion request', { error: error.message });
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }

  logger.warn('[GDPR] Deletion request filed', { userId: user.id });
  return NextResponse.json({ request: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('deletion_requests')
    .update({ status: 'cancelled', processed_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) {
    logger.error('[GDPR] Failed to cancel deletion request', { error: error.message });
    return NextResponse.json({ error: 'Cancel failed' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'No pending request to cancel' }, { status: 404 });
  }

  return NextResponse.json({ cancelled: true });
}
