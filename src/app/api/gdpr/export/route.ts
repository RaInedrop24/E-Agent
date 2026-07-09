/**
 * GDPR Data Export (Art. 20 — right to data portability)
 * GET /api/gdpr/export
 *
 * Returns every piece of personal data we hold about the authenticated
 * user as a downloadable JSON file.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseAdmin } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const userId = user.id;

    // Profile row
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Transactions the user participates in
    const { data: participations } = await supabaseAdmin
      .from('transaction_participants')
      .select('transaction_id, participant_role, invited_at')
      .eq('profile_id', userId);

    const transactionIds = (participations ?? []).map((p) => p.transaction_id);

    const [
      transactionsRes,
      messagesRes,
      filesRes,
      associationsAsBuyerRes,
      associationsAsAgentRes,
      notificationsRes,
      templatesRes,
    ] = await Promise.all([
      transactionIds.length > 0
        ? supabaseAdmin
            .from('transactions')
            .select('*, milestones (*)')
            .in('id', transactionIds)
        : Promise.resolve({ data: [] }),
      supabaseAdmin
        .from('messages')
        .select('*')
        .eq('author_profile_id', userId),
      supabaseAdmin
        .from('files')
        .select('id, transaction_id, milestone_id, file_name, mime_type, file_size, storage_path, created_at')
        .eq('uploaded_by_profile_id', userId),
      supabaseAdmin
        .from('buyer_agent_associations')
        .select('*')
        .eq('buyer_id', userId),
      supabaseAdmin
        .from('buyer_agent_associations')
        .select('*')
        .eq('agent_id', userId),
      supabaseAdmin
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId),
      supabaseAdmin
        .from('milestone_templates')
        .select('*, milestone_template_items (*)')
        .eq('agent_id', userId),
    ]);

    const exportPayload = {
      export_info: {
        generated_at: new Date().toISOString(),
        format: 'JSON',
        regulation: 'GDPR Article 20 (right to data portability)',
        user_id: userId,
      },
      account: {
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        user_metadata: user.user_metadata,
      },
      profile: profile ?? null,
      transaction_participations: participations ?? [],
      transactions: transactionsRes.data ?? [],
      messages_authored: messagesRes.data ?? [],
      files_uploaded: filesRes.data ?? [],
      buyer_agent_associations: [
        ...(associationsAsBuyerRes.data ?? []),
        ...(associationsAsAgentRes.data ?? []),
      ],
      notifications: notificationsRes.data ?? [],
      milestone_templates: templatesRes.data ?? [],
    };

    const filename = `property-gateway-data-export-${new Date().toISOString().slice(0, 10)}.json`;

    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    logger.exception(
      'GDPR export failed',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
