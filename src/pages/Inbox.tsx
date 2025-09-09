import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreatorInbox from '@/components/CreatorInbox';
import MessageSettings from '@/components/MessageSettings';
import { Mail, Settings } from 'lucide-react';

const Inbox: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Message Center</h1>
        <p className="text-muted-foreground">
          Manage your fan messages and messaging settings
        </p>
      </div>

      <Tabs defaultValue="inbox" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Inbox
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-6">
          <CreatorInbox />
        </TabsContent>

        <TabsContent value="settings" className="mt-6 flex justify-center">
          <MessageSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inbox;