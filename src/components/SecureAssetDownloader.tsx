import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Shield, 
  Clock, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useSecureAssets } from '@/hooks/useSecureAssets';
import { format, formatDistanceToNow } from 'date-fns';

interface SecureAssetDownloaderProps {
  redemptionId: string;
  assetName?: string;
  className?: string;
}

export function SecureAssetDownloader({ 
  redemptionId, 
  assetName = 'Digital Asset',
  className 
}: SecureAssetDownloaderProps) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const { 
    loading, 
    generateSecureDownloadUrl, 
    downloadAsset, 
    isValidDownloadUrl 
  } = useSecureAssets();

  const isExpired = expiresAt ? new Date(expiresAt) <= new Date() : false;
  const isValid = downloadUrl && expiresAt && isValidDownloadUrl(downloadUrl, expiresAt);

  const handleGenerateUrl = async () => {
    const result = await generateSecureDownloadUrl(redemptionId);
    
    if (result.success) {
      setDownloadUrl(result.downloadUrl || null);
      setExpiresAt(result.expiresAt || null);
      setHasGenerated(true);
    } else {
      setHasGenerated(true);
    }
  };

  const handleDownload = () => {
    if (downloadUrl && expiresAt) {
      const filename = assetName.includes('.') ? assetName : `${assetName}.zip`;
      downloadAsset(downloadUrl, filename);
    }
  };

  const getTimeRemaining = () => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    
    if (expiry <= now) return 'Expired';
    
    return formatDistanceToNow(expiry, { addSuffix: true });
  };

  return (
    <Card className={`border-2 ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Secure Digital Asset
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{assetName}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              High-value digital content with secure, time-limited access
            </p>
          </div>
          
          <Badge variant="secondary" className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Secured
          </Badge>
        </div>

        {/* Security Notice */}
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Shield className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            This download link is secured and time-limited to protect the creator's intellectual property.
          </AlertDescription>
        </Alert>

        {/* Download Status */}
        {!hasGenerated ? (
          <div className="space-y-3">
            <Button
              onClick={handleGenerateUrl}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Generating Secure Link...' : 'Generate Download Link'}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Click to generate a secure, time-limited download link
            </p>
          </div>
        ) : isValid ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Download link ready</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Expires:</span>
                </div>
                <span className="font-medium text-orange-600">
                  {getTimeRemaining()}
                </span>
              </div>
              
              {expiresAt && (
                <p className="text-xs text-muted-foreground">
                  {format(new Date(expiresAt), 'PPp')}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleDownload} className="flex-1" size="lg">
                <Download className="w-4 h-4 mr-2" />
                Download Now
              </Button>
              
              <Button
                variant="outline"
                onClick={handleGenerateUrl}
                disabled={loading}
                size="lg"
              >
                {loading ? 'Generating...' : 'New Link'}
              </Button>
            </div>
          </div>
        ) : isExpired ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Download link expired</span>
            </div>
            
            <Button
              onClick={handleGenerateUrl}
              disabled={loading}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {loading ? 'Generating New Link...' : 'Generate New Link'}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Links expire for security. Generate a new one to download.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Failed to generate download link. Please try again.
              </AlertDescription>
            </Alert>
            
            <Button
              onClick={handleGenerateUrl}
              disabled={loading}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {loading ? 'Generating Link...' : 'Try Again'}
            </Button>
          </div>
        )}

        {/* Security Information */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div className="space-y-1">
              <div className="font-medium">Security Features</div>
              <ul className="space-y-1">
                <li>• Time-limited access</li>
                <li>• Usage tracking</li>
              </ul>
            </div>
            <div className="space-y-1">
              <div className="font-medium">Download Guidelines</div>
              <ul className="space-y-1">
                <li>• One link per 24 hours</li>
                <li>• Link expires automatically</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}