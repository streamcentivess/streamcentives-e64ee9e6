import React from 'react';
import { useAdminRole } from '@/hooks/useAdminRole';
import StreamseekerAdminPanel from '@/components/StreamseekerAdminPanel';
import AppNavigation from '@/components/AppNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Lock } from 'lucide-react';

const StreamseekerAdminPage = () => {
  const { isAdmin, loading } = useAdminRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavigation />
        <main className="py-6">
          <div className="max-w-4xl mx-auto p-6">
            <div className="text-center">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavigation />
        <main className="py-6">
          <div className="max-w-4xl mx-auto p-6">
            <Card>
              <CardContent className="text-center py-12">
                <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                <p className="text-muted-foreground mb-4">
                  You need admin privileges to access this page.
                </p>
                <p className="text-sm text-muted-foreground">
                  Contact an administrator if you believe this is an error.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      <main className="py-6">
        <StreamseekerAdminPanel />
      </main>
    </div>
  );
};

export default StreamseekerAdminPage;