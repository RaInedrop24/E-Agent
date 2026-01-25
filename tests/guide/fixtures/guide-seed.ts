/**
 * Test Data Seeding for User Guide Screenshots
 *
 * Seeds realistic data for capturing comprehensive screenshots across all languages.
 * Run this before screenshot capture to ensure consistent, professional-looking images.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface GuideSeedData {
  agent: {
    id: string;
    email: string;
    password: string;
    full_name: string;
    website_url: string;
    branding_settings: {
      primary: string;
      secondary: string;
      background: string;
      text: string;
    };
  };
  buyers: Array<{
    id: string;
    email: string;
    full_name: string;
    preferred_language: string;
  }>;
  transactions: Array<{
    id: string;
    title: string;
    property_address: string;
    agent_reference: string;
    status: 'active' | 'completed' | 'archived';
    milestones: Array<{
      name: string;
      completed: boolean;
      notes?: string;
    }>;
  }>;
}

export const GUIDE_SEED_DATA: GuideSeedData = {
  agent: {
    id: 'guide-agent-00000001',
    email: 'guide-agent@example.com',
    password: 'GuideTest123!',
    full_name: 'Marco Rossi',
    website_url: 'https://rossi-properties.it',
    branding_settings: {
      primary: '#1e40af',    // Blue
      secondary: '#f59e0b',  // Amber
      background: '#f8fafc', // Slate-50
      text: '#1e293b'        // Slate-800
    }
  },
  buyers: [
    {
      id: 'guide-buyer-00000001',
      email: 'john.smith@example.com',
      full_name: 'John Smith',
      preferred_language: 'en'
    },
    {
      id: 'guide-buyer-00000002',
      email: 'marie.dubois@example.com',
      full_name: 'Marie Dubois',
      preferred_language: 'fr'
    },
    {
      id: 'guide-buyer-00000003',
      email: 'hans.mueller@example.com',
      full_name: 'Hans Müller',
      preferred_language: 'de'
    }
  ],
  transactions: [
    {
      id: 'guide-txn-00000001',
      title: 'Villa Toscana - Firenze',
      property_address: 'Via dei Giardini 42, 50100 Firenze FI, Italy',
      agent_reference: 'FI-2024-001',
      status: 'active',
      milestones: [
        { name: 'Initial Contact', completed: true, notes: 'First meeting completed' },
        { name: 'Property Viewing', completed: true, notes: 'Client loved the garden' },
        { name: 'Offer Submitted', completed: true },
        { name: 'Offer Accepted', completed: true },
        { name: 'Legal Review', completed: false },
        { name: 'Survey & Inspection', completed: false },
        { name: 'Final Contract', completed: false },
        { name: 'Completion', completed: false }
      ]
    },
    {
      id: 'guide-txn-00000002',
      title: 'Appartamento Centro Storico',
      property_address: 'Piazza Navona 15, 00186 Roma RM, Italy',
      agent_reference: 'RM-2024-003',
      status: 'active',
      milestones: [
        { name: 'Initial Contact', completed: true },
        { name: 'Property Viewing', completed: true },
        { name: 'Offer Submitted', completed: false },
        { name: 'Offer Accepted', completed: false },
        { name: 'Legal Review', completed: false },
        { name: 'Final Contract', completed: false },
        { name: 'Completion', completed: false }
      ]
    },
    {
      id: 'guide-txn-00000003',
      title: 'Rustico Chianti',
      property_address: 'Strada del Vino 88, 53011 Castellina in Chianti SI, Italy',
      agent_reference: 'SI-2024-007',
      status: 'completed',
      milestones: [
        { name: 'Initial Contact', completed: true },
        { name: 'Property Viewing', completed: true },
        { name: 'Offer Submitted', completed: true },
        { name: 'Offer Accepted', completed: true },
        { name: 'Legal Review', completed: true },
        { name: 'Survey & Inspection', completed: true },
        { name: 'Final Contract', completed: true },
        { name: 'Completion', completed: true, notes: 'Keys handed over - congratulations!' }
      ]
    }
  ]
};

/**
 * Seeds the database with guide test data
 * Only run in test/development environments
 */
export async function seedGuideData(): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials for seeding');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('Starting guide data seed...');

  // Clean up any existing guide data
  await cleanupGuideData(supabase);

  // Create agent user
  const { data: agentAuth, error: agentAuthError } = await supabase.auth.admin.createUser({
    email: GUIDE_SEED_DATA.agent.email,
    password: GUIDE_SEED_DATA.agent.password,
    email_confirm: true,
    user_metadata: { full_name: GUIDE_SEED_DATA.agent.full_name, role: 'agent' }
  });

  if (agentAuthError) {
    console.error('Failed to create agent:', agentAuthError);
    return;
  }

  // Update agent profile with branding
  await supabase
    .from('profiles')
    .update({
      full_name: GUIDE_SEED_DATA.agent.full_name,
      website_url: GUIDE_SEED_DATA.agent.website_url,
      branding_settings: GUIDE_SEED_DATA.agent.branding_settings,
      role: 'agent'
    })
    .eq('id', agentAuth.user.id);

  // Create buyers
  for (const buyer of GUIDE_SEED_DATA.buyers) {
    const { error: buyerError } = await supabase.auth.admin.createUser({
      email: buyer.email,
      password: 'BuyerTest123!',
      email_confirm: true,
      user_metadata: { full_name: buyer.full_name, role: 'buyer' }
    });

    if (buyerError) {
      console.error(`Failed to create buyer ${buyer.email}:`, buyerError);
    }
  }

  // Create transactions
  for (const txn of GUIDE_SEED_DATA.transactions) {
    const { data: transaction, error: txnError } = await supabase
      .from('transactions')
      .insert({
        title: txn.title,
        property_address: txn.property_address,
        agent_reference: txn.agent_reference,
        status: txn.status,
        created_by: agentAuth.user.id
      })
      .select()
      .single();

    if (txnError) {
      console.error(`Failed to create transaction ${txn.title}:`, txnError);
      continue;
    }

    // Add agent as participant
    await supabase
      .from('transaction_participants')
      .insert({
        transaction_id: transaction.id,
        user_id: agentAuth.user.id,
        role: 'agent'
      });

    // Create milestones
    for (let i = 0; i < txn.milestones.length; i++) {
      const milestone = txn.milestones[i];
      await supabase
        .from('milestones')
        .insert({
          transaction_id: transaction.id,
          name: milestone.name,
          sort_order: i,
          completed: milestone.completed,
          notes: milestone.notes || null
        });
    }
  }

  console.log('Guide data seed completed successfully!');
}

/**
 * Cleans up guide test data from the database
 */
export async function cleanupGuideData(supabase: ReturnType<typeof createClient>): Promise<void> {
  console.log('Cleaning up existing guide data...');

  // Delete guide users by email pattern
  const guideEmails = [
    GUIDE_SEED_DATA.agent.email,
    ...GUIDE_SEED_DATA.buyers.map(b => b.email)
  ];

  for (const email of guideEmails) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users.find(u => u.email === email);
    if (user) {
      await supabase.auth.admin.deleteUser(user.id);
    }
  }

  console.log('Cleanup completed.');
}

// CLI runner
if (require.main === module) {
  seedGuideData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
