import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client (with service role key for full access)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Use word boundaries \b to match only SQL commands, not column names like "updated_at"
const WRITE_PATTERNS = [
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+\w+\s+SET\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bDROP\s+(TABLE|DATABASE|FUNCTION|TRIGGER|INDEX)\b/i,
  /\bALTER\s+(TABLE|DATABASE)\b/i,
  /\bCREATE\s+(TABLE|DATABASE|FUNCTION|TRIGGER|INDEX)\b/i,
  /\bTRUNCATE\s+TABLE\b/i,
];

function containsWriteOperations(query: string): boolean {
  return WRITE_PATTERNS.some(pattern => pattern.test(query));
}

export async function POST(request: NextRequest) {
  try {
    const { query, allowWrite = false } = await request.json();

    // Verify user is super admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    // Validate query
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Security check - prevent write operations unless explicitly allowed
    if (!allowWrite && containsWriteOperations(query)) {
      return NextResponse.json({ 
        error: 'Write operations not allowed. Enable "Allow Write Operations" to execute this query.',
        isWriteQuery: true
      }, { status: 400 });
    }

    // Execute query with timeout
    const startTime = Date.now();
    
    // Use RPC to execute raw SQL
    const { data, error, count } = await supabaseAdmin.rpc('execute_sql_query', {
      p_query: query
    });

    const executionTime = Date.now() - startTime;

    if (error) {
      // Return SQL error details
      return NextResponse.json({
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        executionTime,
      }, { status: 400 });
    }

    // Format response
    return NextResponse.json({
      success: true,
      data,
      rowCount: Array.isArray(data) ? data.length : count || 0,
      executionTime,
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
    });

  } catch (error) {
    console.error('[SQL Editor] Error:', error);
    return NextResponse.json({
      error: (error instanceof Error ? error.message : '') || 'Failed to execute query',
      details: String(error),
    }, { status: 500 });
  }
}

// Health check
export async function GET(request: NextRequest) {
  try {
    // Verify user is super admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    // Check if execute_sql_query function exists
    const { error: testError } = await supabaseAdmin.rpc('execute_sql_query', {
      p_query: 'SELECT 1 as test'
    });

    if (testError && testError.code === '42883') {
      return NextResponse.json({ 
        available: false,
        error: 'execute_sql_query function not found. Migration required.',
        requiresMigration: true
      });
    }

    return NextResponse.json({ 
      available: true,
      message: 'SQL Editor ready'
    });

  } catch (error) {
    return NextResponse.json({
      available: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

