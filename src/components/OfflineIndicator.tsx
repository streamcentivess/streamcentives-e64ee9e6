import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  WifiOff, 
  Wifi, 
  CloudOff, 
  RefreshCw, 
  AlertCircle,
  CheckCircle 
} from 'lucide-react';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';
import { format } from 'date-fns';

const OfflineIndicator = () => {
  const { 
    isOffline, 
    queueSize, 
    syncOfflineData, 
    lastSync,
    clearSyncedItems 
  } = useOfflineStorage();
  
  const { networkStatus, hapticImpact } = useMobileCapabilities();

  const handleSyncClick = async () => {
    await hapticImpact();
    await syncOfflineData();
  };

  if (!isOffline && queueSize === 0) {
    return null; // Don't show indicator when online and no pending items
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 pointer-events-none">
      <Card className="pointer-events-auto bg-background/95 backdrop-blur-lg border-border shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Network Status Icon */}
              <div className={`flex items-center gap-2 ${
                isOffline ? 'text-red-500' : 'text-green-500'
              }`}>
                {isOffline ? (
                  <WifiOff className="h-4 w-4" />
                ) : (
                  <Wifi className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {isOffline ? 'Offline' : 'Online'}
                </span>
              </div>

              {/* Connection Type */}
              {!isOffline && networkStatus.connectionType !== 'unknown' && (
                <Badge variant="outline" className="text-xs">
                  {networkStatus.connectionType}
                </Badge>
              )}

              {/* Offline Queue */}
              {queueSize > 0 && (
                <div className="flex items-center gap-2 text-orange-500">
                  <CloudOff className="h-4 w-4" />
                  <span className="text-sm">
                    {queueSize} pending
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Last Sync Time */}
              {lastSync && (
                <span className="text-xs text-muted-foreground">
                  Synced {format(new Date(lastSync), 'HH:mm')}
                </span>
              )}

              {/* Sync Button */}
              {!isOffline && queueSize > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSyncClick}
                  className="h-8 px-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sync
                </Button>
              )}

              {/* Clear Button */}
              {queueSize > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearSyncedItems}
                  className="h-8 px-2 text-muted-foreground"
                >
                  <CheckCircle className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Offline Message */}
          {isOffline && (
            <div className="mt-2 pt-2 border-t border-border">
              <div className="flex items-start gap-2 text-amber-600">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">You're offline</p>
                  <p className="text-xs text-muted-foreground">
                    Your actions are saved and will sync when connection returns
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineIndicator;