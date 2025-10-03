import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, BellRing, Check, X, Settings, Filter, Eye, Heart, MessageCircle, Repeat, Share, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useOptimizedRealtime } from '@/hooks/useOptimizedRealtime';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
  priority: string;
  action_url?: string;
}

export function EnhancedNotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'social' | 'offers' | 'profile_views'>('all');
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up optimized real-time updates
  useOptimizedRealtime({
    table: 'notifications',
    filter: `user_id=eq.${user?.id}`,
    onUpdate: fetchNotifications,
    enabled: !!user
  });

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase.rpc('mark_notifications_read', {
        notification_ids: notificationIds
      });

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          notificationIds.includes(n.id) ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));

      toast({
        title: "Notifications marked as read",
        description: `Marked ${notificationIds.length} notification(s) as read.`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  // Auto-mark notifications as read when sheet is opened
  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length > 0) {
        // Mark as read silently (without toast)
        supabase.rpc('mark_notifications_read', {
          notification_ids: unreadIds
        }).then(({ error }) => {
          if (!error) {
            setNotifications(prev =>
              prev.map(n => unreadIds.includes(n.id) ? { ...n, is_read: true } : n)
            );
            setUnreadCount(0);
          }
        });
      }
    }
  }, [isOpen, notifications.length]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string, interactionType?: string) => {
    switch (type) {
      case 'social_interaction':
        switch (interactionType) {
          case 'like': return <Heart className="h-4 w-4 text-red-500" />;
          case 'comment': return <MessageCircle className="h-4 w-4 text-blue-500" />;
          case 'repost': return <Repeat className="h-4 w-4 text-green-500" />;
          case 'share': return <Share className="h-4 w-4 text-purple-500" />;
          default: return <Bell className="h-4 w-4" />;
        }
      case 'profile_view': return <Eye className="h-4 w-4 text-indigo-500" />;
      case 'follow': return <Users className="h-4 w-4 text-blue-600" />;
      case 'offer_response': return <Check className="h-4 w-4 text-green-600" />;
      case 'message': return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'reward': return '🎁';
      case 'campaign': return '🎯';
      case 'xp': return '⚡';
      case 'system': return '⚙️';
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.is_read;
      case 'social': return notification.type === 'social_interaction';
      case 'offers': return notification.type === 'offer_response';
      case 'profile_views': return notification.type === 'profile_view';
      default: return true;
    }
  });

  const getFilterCounts = () => {
    return {
      all: notifications.length,
      unread: notifications.filter(n => !n.is_read).length,
      social: notifications.filter(n => n.type === 'social_interaction').length,
      offers: notifications.filter(n => n.type === 'offer_response').length,
      profile_views: notifications.filter(n => n.type === 'profile_view').length,
    };
  };

  const counts = getFilterCounts();

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      await markAsRead([notification.id]);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'social_interaction':
        const interactionType = notification.data?.interaction_type;
        const contentId = notification.data?.content_id;
        
        if (interactionType === 'comment' && contentId) {
          navigate(`/feed?post=${contentId}&comments=open`);
        } else if (interactionType === 'follow') {
          if (notification.data?.actor_username) {
            navigate(`/${notification.data.actor_username}`);
          } else if (notification.data?.actor_id) {
            const { data } = await supabase.from('profiles').select('username').eq('user_id', notification.data.actor_id).maybeSingle();
            if (data?.username) navigate(`/${data.username}`);
          }
        } else if (contentId) {
          navigate(`/feed?post=${contentId}`);
        }
        break;
        
      case 'profile_view': 
        if (notification.data?.viewer_username) {
          navigate(`/${notification.data.viewer_username}`);
        } else if (notification.data?.viewer_id) {
          const { data } = await supabase.from('profiles').select('username').eq('user_id', notification.data.viewer_id).maybeSingle();
          if (data?.username) navigate(`/${data.username}`);
        }
        break;
        
      case 'follow':
        if (notification.data?.follower_username) {
          navigate(`/${notification.data.follower_username}`);
        } else if (notification.data?.follower_id) {
          const { data } = await supabase.from('profiles').select('username').eq('user_id', notification.data.follower_id).maybeSingle();
          if (data?.username) navigate(`/${data.username}`);
        }
        break;
        
      case 'new_message':
        navigate('/inbox');
        break;
        
      case 'sponsor_offer':
        navigate('/sponsor-dashboard');
        break;
        
      case 'reward_purchased':
        navigate('/manage-rewards');
        break;
        
      case 'campaign_join':
      case 'campaign_invite':
        navigate('/campaigns');
        break;
        
      default:
        if (notification.action_url) {
          navigate(notification.action_url);
        }
        break;
    }
    
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <BellRing className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </span>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilter('all')}>
                    All Notifications ({counts.all})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('unread')}>
                    Unread Only ({counts.unread})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('social')}>
                    Social Interactions ({counts.social})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('profile_views')}>
                    Profile Views ({counts.profile_views})
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter('offers')}>
                    Offers ({counts.offers})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-1" />
                  Mark All Read
                </Button>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          {/* Filter Tabs */}
          <div className="flex gap-1 mb-4 overflow-x-auto">
            {[
              { key: 'all', label: 'All', count: counts.all },
              { key: 'unread', label: 'Unread', count: counts.unread },
              { key: 'social', label: 'Social', count: counts.social },
              { key: 'profile_views', label: 'Views', count: counts.profile_views },
              { key: 'offers', label: 'Offers', count: counts.offers }
            ].map(({ key, label, count }) => (
              <Button
                key={key}
                variant={filter === key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter(key as any)}
                className="flex items-center gap-1 whitespace-nowrap"
              >
                {label}
                {count > 0 && (
                  <Badge variant="outline" className="ml-1 text-xs">
                    {count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading notifications...</div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                {filter === 'unread' ? "You're all caught up!" : "You'll see your notifications here."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {filteredNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <Card 
                      className={`${!notification.is_read ? 'ring-2 ring-primary/20' : ''} transition-all hover:shadow-md cursor-pointer`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {typeof getTypeIcon(notification.type, notification.data?.interaction_type) === 'string' 
                              ? <span className="text-lg">{getTypeIcon(notification.type, notification.data?.interaction_type)}</span>
                              : getTypeIcon(notification.type, notification.data?.interaction_type)
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm leading-tight">
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                                    {notification.priority}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(notification.created_at), 'MMM dd, HH:mm')}
                                  </span>
                                  {notification.type === 'social_interaction' && notification.data?.interaction_type && (
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {notification.data.interaction_type}
                                    </Badge>
                                  )}
                                 </div>
                               </div>
                             </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    {index < filteredNotifications.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}