/**
 * Supabase Management API Client
 * Fetches real-time metrics from Supabase using a Personal Access Token
 * Docs: https://supabase.com/docs/reference/api/introduction
 */

interface SupabaseProject {
  id: string;
  organization_id: string;
  name: string;
  region: string;
  created_at: string;
}

interface DatabaseStats {
  db_size: number; // bytes
}

interface StorageStats {
  total_storage_size: number; // bytes
}

interface UsageStats {
  // This structure varies, you'll need to check actual API response
  egress: number; // bytes
  db_size: number; // bytes
  storage_size: number; // bytes
  monthly_active_users: number;
}

export class SupabaseManagementAPI {
  private baseUrl = 'https://api.supabase.com/v1';
  private token: string;
  private projectRef: string;

  constructor(token: string, projectRef: string) {
    this.token = token;
    this.projectRef = projectRef;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase Management API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get project details
   */
  async getProject(): Promise<SupabaseProject> {
    return this.fetch<SupabaseProject>(`/projects/${this.projectRef}`);
  }

  /**
   * Get database statistics
   * NOTE: This endpoint is NOT available in the public Management API v1
   * Metrics are only available through the Supabase Dashboard UI
   */
  async getDatabaseStats(): Promise<DatabaseStats | null> {
    // These endpoints don't exist in public API
    return null;
  }

  /**
   * Get storage statistics
   * NOTE: This endpoint is NOT available in the public Management API v1
   * Metrics are only available through the Supabase Dashboard UI
   */
  async getStorageStats(): Promise<StorageStats | null> {
    // These endpoints don't exist in public API
    return null;
  }

  /**
   * Get usage statistics (bandwidth, MAU, etc.)
   * NOTE: This endpoint is NOT available in the public Management API v1
   * Metrics are only available through the Supabase Dashboard UI
   */
  async getUsageStats(startDate?: string, endDate?: string): Promise<any> {
    // These endpoints don't exist in public API
    return null;
  }

  /**
   * Get all metrics in one call
   */
  async getAllMetrics() {
    const [project, dbStats, storageStats, usageStats] = await Promise.allSettled([
      this.getProject(),
      this.getDatabaseStats(),
      this.getStorageStats(),
      this.getUsageStats(),
    ]);

    return {
      project: project.status === 'fulfilled' ? project.value : null,
      database: dbStats.status === 'fulfilled' ? dbStats.value : null,
      storage: storageStats.status === 'fulfilled' ? storageStats.value : null,
      usage: usageStats.status === 'fulfilled' ? usageStats.value : null,
      errors: [
        project.status === 'rejected' ? project.reason : null,
        dbStats.status === 'rejected' ? dbStats.reason : null,
        storageStats.status === 'rejected' ? storageStats.reason : null,
        usageStats.status === 'rejected' ? usageStats.reason : null,
      ].filter(Boolean),
    };
  }
}

/**
 * Create a Supabase Management API client
 * Requires SUPABASE_MANAGEMENT_TOKEN and SUPABASE_PROJECT_REF env vars
 */
export function createManagementClient() {
  const token = process.env.SUPABASE_MANAGEMENT_TOKEN;
  const projectRef = process.env.SUPABASE_PROJECT_REF;

  if (!token || !projectRef) {
    throw new Error('SUPABASE_MANAGEMENT_TOKEN and SUPABASE_PROJECT_REF must be set');
  }

  return new SupabaseManagementAPI(token, projectRef);
}

/**
 * Check if Management API is configured
 */
export function isManagementAPIConfigured(): boolean {
  return !!(process.env.SUPABASE_MANAGEMENT_TOKEN && process.env.SUPABASE_PROJECT_REF);
}

