import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AssetDownloadResult {
  success: boolean;
  downloadUrl?: string;
  expiresAt?: string;
  assetName?: string;
  error?: string;
}

interface AccessLog {
  id: string;
  reward_redemption_id: string;
  accessed_at: string;
  expires_at: string;
  asset_key: string;
  asset_bucket: string;
}

export function useSecureAssets() {
  const [loading, setLoading] = useState(false);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const { toast } = useToast();

  const generateSecureDownloadUrl = async (redemptionId: string): Promise<AssetDownloadResult> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-secure-asset-url', {
        body: {
          redemptionId,
          userAgent: navigator.userAgent,
          ipAddress: undefined // Will be detected by the server
        }
      });

      if (error) {
        console.error('Error generating secure URL:', error);
        toast({
          title: 'Download Error',
          description: error.message || 'Failed to generate download link',
          variant: 'destructive'
        });
        return { success: false, error: error.message };
      }

      if (data.success) {
        toast({
          title: 'Download Ready',
          description: `Your secure download link is ready and expires in ${Math.floor(
            (new Date(data.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60)
          )} hours`,
          variant: 'default'
        });

        return {
          success: true,
          downloadUrl: data.downloadUrl,
          expiresAt: data.expiresAt,
          assetName: data.assetName
        };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error.message || 'Failed to generate download link';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessLogs = async (userId?: string) => {
    try {
      const query = supabase
        .from('digital_asset_access_logs')
        .select('*')
        .order('accessed_at', { ascending: false });

      if (userId) {
        query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching access logs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load access logs',
          variant: 'destructive'
        });
        return;
      }

      setAccessLogs(data || []);
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Failed to load access logs',
        variant: 'destructive'
      });
    }
  };

  const downloadAsset = async (url: string, filename: string) => {
    try {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = '_blank';
      
      // Append to DOM, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Download Started',
        description: `Downloading ${filename}...`,
        variant: 'default'
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to start download',
        variant: 'destructive'
      });
    }
  };

  const isValidDownloadUrl = (url: string, expiresAt: string): boolean => {
    return new Date(expiresAt) > new Date();
  };

  return {
    loading,
    accessLogs,
    generateSecureDownloadUrl,
    fetchAccessLogs,
    downloadAsset,
    isValidDownloadUrl
  };
}