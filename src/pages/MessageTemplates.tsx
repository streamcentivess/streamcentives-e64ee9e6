import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import MessageTemplateManager from '@/components/MessageTemplateManager';

const MessageTemplates: React.FC = () => {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <MessageTemplateManager mode="manage" />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default MessageTemplates;