import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Loader2, Paperclip } from 'lucide-react';
import { notifyFileUpload } from '@/app/actions/transaction';

type MilestoneOption = {
  id: string;
  label: string;
};

type FileRow = {
  id: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  storage_path: string;
  created_at: string;
  milestone_id: string | null;
  milestone_label: string | null;
  uploaded_by: string | null;
};

interface TransactionFilesPanelProps {
  transactionId: string;
  milestones: MilestoneOption[];
  canUpload: boolean;
}

export function TransactionFilesPanel({
  transactionId,
  milestones,
  canUpload,
}: TransactionFilesPanelProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [files, setFiles] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const milestoneOptions = useMemo<MilestoneOption[]>(
    () => [{ id: 'none', label: t('files.unassigned') }, ...milestones],
    [milestones, t]
  );

  const fetchFiles = async () => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('files')
        .select(`
          id,
          file_name,
          mime_type,
          file_size,
          storage_path,
          milestone_id,
          created_at,
          milestones (
            label_en,
            label_it
          ),
          profiles!files_uploaded_by_profile_id_fkey (
            full_name
          )
        `)
        .eq('transaction_id', transactionId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: FileRow[] = (data || []).map((f: any) => ({
        id: f.id,
        file_name: f.file_name,
        mime_type: f.mime_type,
        file_size: f.file_size,
        storage_path: f.storage_path,
        milestone_id: f.milestone_id,
        milestone_label:
          language === 'it'
            ? f.milestones?.label_it || f.milestones?.label_en || null
            : f.milestones?.label_en || f.milestones?.label_it || null,
        created_at: f.created_at,
        uploaded_by: f.profiles?.full_name || null,
      }));

      setFiles(mapped);
    } catch (err: any) {
      setError(err.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  const handleUpload = async () => {
    if (!supabase || !user) return;
    if (!selectedFile) {
      setError(t('files.selectFileFirst'));
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError(t('files.tooLarge'));
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      if (selectedMilestone && selectedMilestone !== 'none') {
        formData.append('milestoneId', selectedMilestone);
      }

      const response = await fetch(`/api/transaction/${transactionId}/files`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Upload failed');
      }

      // Trigger notifications
      await notifyFileUpload(transactionId, selectedFile.name, user.id);

      setSelectedFile(null);
      setSelectedMilestone(null);
      await fetchFiles();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const humanSize = (bytes?: number | null) => {
    if (!bytes) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit += 1;
    }
    return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unit]}`;
  };

  const fetchSignedUrl = async (storagePath: string) => {
      const { data, error: urlError } = await supabase.storage
      .from('transaction_files')
      .createSignedUrl(storagePath, 60 * 15); // 15 minutes
    if (urlError) {
      throw urlError;
    }
    return data.signedUrl;
  };

  const handleDownload = async (file: FileRow) => {
    try {
      const url = await fetchSignedUrl(file.storage_path);
      window.open(url, '_blank');
    } catch (err: any) {
      setError(t('files.downloadFailed'));
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {canUpload && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1 flex gap-2 items-center">
                <div className="relative">
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" type="button" className="pointer-events-none">
                    {t('settings.chooseFile')}
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground truncate flex-1">
                  {selectedFile ? selectedFile.name : t('settings.noFileChosen')}
                </span>
              </div>
              <div className="w-full md:w-64">
                <Select
                  value={selectedMilestone || 'none'}
                  onValueChange={(val) => setSelectedMilestone(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('files.selectMilestone')} />
                  </SelectTrigger>
                  <SelectContent>
                    {milestoneOptions.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploading ? t('files.uploading') : t('files.upload')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('files.limitNote')}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('files.loading')}</span>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <Paperclip className="h-10 w-10 mb-3 text-muted-foreground/60" />
              <p>{t('files.noFiles')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{file.file_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {humanSize(file.file_size)} •{' '}
                      {new Date(file.created_at).toLocaleString()}
                      {file.uploaded_by ? ` • ${t('files.uploadedBy')} ${file.uploaded_by}` : ''}
                    </div>
                    {file.milestone_label && (
                      <div className="text-xs text-muted-foreground">
                        {t('files.forMilestone')}: {file.milestone_label}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(file)}>
                      <Download className="h-4 w-4 mr-1" />
                      {t('files.download')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

