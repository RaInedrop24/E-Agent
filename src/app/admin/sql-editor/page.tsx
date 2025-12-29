'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Play,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  BookOpen,
  Loader2,
  Copy,
  Shield,
} from 'lucide-react';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { supabase } from '@/lib/supabase';

// Example queries for super admins
const EXAMPLE_QUERIES = [
  {
    name: 'User Overview',
    description: 'Get a summary of all users, roles, and activity',
    query: `SELECT 
  role,
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_super_admin THEN 1 END) as super_admins,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_this_week,
  COUNT(CASE WHEN updated_at > NOW() - INTERVAL '1 day' THEN 1 END) as active_today
FROM profiles
GROUP BY role
ORDER BY total_users DESC;`,
  },
  {
    name: 'Transaction Statistics',
    description: 'Overview of all transactions by status',
    query: `SELECT 
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as created_last_30_days,
  AVG(
    (SELECT COUNT(*) FROM milestones m WHERE m.transaction_id = t.id AND m.completed)::float / 
    NULLIF((SELECT COUNT(*) FROM milestones m WHERE m.transaction_id = t.id), 0) * 100
  )::numeric(5,2) as avg_completion_rate
FROM transactions t
GROUP BY status
ORDER BY count DESC;`,
  },
  {
    name: 'Top Agents by Transactions',
    description: 'Agents with most transactions',
    query: `SELECT 
  p.id,
  p.full_name,
  COUNT(t.id) as total_transactions,
  COUNT(CASE WHEN t.status = 'active' THEN 1 END) as active_transactions,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_transactions,
  MAX(t.created_at) as last_transaction_date
FROM profiles p
LEFT JOIN transactions t ON t.created_by = p.id
WHERE p.role = 'agent'
GROUP BY p.id, p.full_name
HAVING COUNT(t.id) > 0
ORDER BY total_transactions DESC
LIMIT 20;`,
  },
  {
    name: 'Milestone Templates Usage',
    description: 'Most used milestone templates',
    query: `SELECT 
  mt.id,
  mt.template_name,
  mt.description,
  p.full_name as created_by,
  (SELECT COUNT(*) FROM milestone_template_items WHERE template_id = mt.id) as milestone_count,
  mt.created_at
FROM milestone_templates mt
LEFT JOIN profiles p ON p.id = mt.agent_id
ORDER BY mt.created_at DESC
LIMIT 20;`,
  },
  {
    name: 'Storage Analysis',
    description: 'File storage usage by transaction',
    query: `SELECT 
  t.id,
  COALESCE(t.title_en, t.title) as transaction_title,
  p.full_name as agent_name,
  COUNT(f.id) as file_count,
  SUM(f.file_size)::bigint as total_bytes,
  ROUND(SUM(f.file_size) / 1024.0 / 1024.0, 2) as total_mb
FROM transactions t
LEFT JOIN files f ON f.transaction_id = t.id
LEFT JOIN profiles p ON p.id = t.created_by
GROUP BY t.id, COALESCE(t.title_en, t.title), p.full_name
HAVING SUM(f.file_size) > 0 OR COUNT(f.id) > 0
ORDER BY total_bytes DESC NULLS LAST
LIMIT 20;`,
  },
  {
    name: 'Recent Activity Log',
    description: 'Last 50 system activities',
    query: `SELECT 
  'Transaction' as type,
  t.title_en as title,
  t.status,
  p.full_name as user,
  t.updated_at as activity_date
FROM transactions t
LEFT JOIN profiles p ON p.id = t.created_by
ORDER BY t.updated_at DESC
LIMIT 50;`,
  },
  {
    name: 'Milestone Completion Rates',
    description: 'Completion rates by transaction',
    query: `SELECT 
  t.id,
  t.title_en as transaction_title,
  COUNT(m.id) as total_milestones,
  COUNT(CASE WHEN m.completed THEN 1 END) as completed_milestones,
  ROUND(
    COUNT(CASE WHEN m.completed THEN 1 END)::numeric / 
    NULLIF(COUNT(m.id), 0) * 100, 
    2
  ) as completion_percentage,
  t.status
FROM transactions t
LEFT JOIN milestones m ON m.transaction_id = t.id
GROUP BY t.id, t.title_en, t.status
HAVING COUNT(m.id) > 0
ORDER BY completion_percentage DESC
LIMIT 20;`,
  },
  {
    name: 'User Language Preferences',
    description: 'Distribution of preferred languages',
    query: `SELECT 
  preferred_language,
  role,
  COUNT(*) as user_count
FROM profiles
GROUP BY preferred_language, role
ORDER BY user_count DESC;`,
  },
  {
    name: 'Database Tables Overview',
    description: 'List all tables with row counts',
    query: `SELECT 
  schemaname,
  relname as tablename,
  n_live_tup as row_count,
  n_tup_ins as total_inserts,
  n_tup_upd as total_updates,
  n_tup_del as total_deletes,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;`,
  },
  {
    name: 'Super Admin List',
    description: 'All users with super admin access',
    query: `SELECT 
  p.id,
  p.full_name,
  au.email,
  p.role,
  p.is_super_admin,
  p.created_at,
  p.updated_at
FROM profiles p
JOIN auth.users au ON au.id = p.id
WHERE p.is_super_admin = true
ORDER BY p.created_at DESC;`,
  },
];

interface QueryResult {
  success: boolean;
  data?: any[];
  rowCount?: number;
  executionTime?: number;
  error?: string;
  details?: string;
  hint?: string;
  code?: string;
  isWriteQuery?: boolean;
}

export default function SQLEditorPage() {
  const router = useRouter();
  const { isSuperAdmin, loading: authLoading } = useSuperAdmin();
  const [query, setQuery] = useState('');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [allowWrite, setAllowWrite] = useState(false);
  const [selectedExample, setSelectedExample] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push('/dashboard');
    }
  }, [isSuperAdmin, authLoading, router]);

  const handleLoadExample = (exampleName: string) => {
    const example = EXAMPLE_QUERIES.find(q => q.name === exampleName);
    if (example) {
      setQuery(example.query);
      setSelectedExample(exampleName);
      setResult(null);
    }
  };

  const handleExecuteQuery = async () => {
    if (!query.trim()) {
      setResult({
        success: false,
        error: 'Please enter a query',
      });
      return;
    }

    try {
      setExecuting(true);
      setResult(null);

      // Get current session token
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/super-admin/sql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          query: query.trim(),
          allowWrite,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          error: data.error || 'Query execution failed',
          details: data.details,
          hint: data.hint,
          code: data.code,
          executionTime: data.executionTime,
          isWriteQuery: data.isWriteQuery,
        });
      } else {
        setResult({
          success: true,
          data: data.data,
          rowCount: data.rowCount,
          executionTime: data.executionTime,
        });
      }
    } catch (error: any) {
      console.error('[SQL Editor] Error:', error);
      setResult({
        success: false,
        error: error.message || 'Failed to execute query',
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleCopyQuery = () => {
    navigator.clipboard.writeText(query);
  };

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            <h1 className="text-3xl font-bold">SQL Query Editor</h1>
            <Badge variant="destructive" className="gap-1">
              <Shield className="h-3 w-3" />
              Super Admin
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Execute SQL queries to analyze and manage your database
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <Card className="border-yellow-300 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-yellow-900">Use with Caution</p>
              <p className="text-sm text-yellow-800 mt-1">
                This tool executes SQL queries directly on your production database. 
                Write operations are disabled by default. Always test queries on a development environment first.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Example Queries Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Example Queries
            </CardTitle>
            <CardDescription>
              Click to load pre-built queries
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {EXAMPLE_QUERIES.map((example) => (
              <Button
                key={example.name}
                variant={selectedExample === example.name ? 'default' : 'outline'}
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleLoadExample(example.name)}
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold">{example.name}</span>
                  <span className="text-xs text-muted-foreground font-normal mt-1">
                    {example.description}
                  </span>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Query Editor and Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Query Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Query Editor</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="allow-write"
                      checked={allowWrite}
                      onCheckedChange={setAllowWrite}
                    />
                    <Label htmlFor="allow-write" className="text-sm cursor-pointer">
                      Allow Write Operations
                    </Label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyQuery}
                    disabled={!query}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your SQL query here...&#10;Example: SELECT * FROM profiles LIMIT 10;"
                className="font-mono text-sm min-h-[200px]"
                disabled={executing}
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {query.length} characters
                </div>
                <Button
                  onClick={handleExecuteQuery}
                  disabled={executing || !query.trim()}
                  className="gap-2"
                >
                  {executing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Execute Query
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {result.success ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Query Results
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        Query Error
                      </>
                    )}
                  </CardTitle>
                  {result.executionTime !== undefined && (
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {result.executionTime}ms
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {result.success ? (
                  <>
                    <div className="mb-4">
                      <Badge variant="secondary">
                        {result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'} returned
                      </Badge>
                    </div>
                    {result.data && result.data.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-muted">
                              {Object.keys(result.data[0]).map((key) => (
                                <th
                                  key={key}
                                  className="border px-3 py-2 text-left font-semibold"
                                >
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.data.map((row, rowIndex) => (
                              <tr key={rowIndex} className="hover:bg-muted/50">
                                {Object.values(row).map((value: any, cellIndex) => (
                                  <td key={cellIndex} className="border px-3 py-2">
                                    {value === null ? (
                                      <span className="text-muted-foreground italic">null</span>
                                    ) : typeof value === 'object' ? (
                                      <code className="text-xs">
                                        {JSON.stringify(value)}
                                      </code>
                                    ) : (
                                      String(value)
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Query executed successfully. No rows returned.</p>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-semibold text-red-900">{result.error}</p>
                      {result.details && (
                        <p className="text-sm text-red-800 mt-2">{result.details}</p>
                      )}
                      {result.hint && (
                        <p className="text-sm text-red-700 mt-2">
                          <strong>Hint:</strong> {result.hint}
                        </p>
                      )}
                      {result.code && (
                        <p className="text-xs text-red-600 mt-2">
                          Error Code: {result.code}
                        </p>
                      )}
                    </div>
                    {result.isWriteQuery && (
                      <p className="text-sm text-muted-foreground">
                        💡 Enable "Allow Write Operations" switch if you intend to modify data.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

