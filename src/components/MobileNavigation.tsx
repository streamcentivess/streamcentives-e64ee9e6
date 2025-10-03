import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Plus, Heart, User, Trophy, MessageSquare, Store, Camera, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useMobileCapabilities } from '@/hooks/useMobileCapabilities';
import { ImpactStyle } from '@capacitor/haptics';

interface NavigationItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
  requiresAuth?: boolean;
}

const MobileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { role: userRole } = useUserRole();
  const { hapticImpact, isNative } = useMobileCapabilities();

  const navigationItems: NavigationItem[] = [
    {
      icon: Home,
      label: 'Home',
      path: '/feed',
    },
    {
      icon: Camera,
      label: 'Stories',
      path: '/stories',
      requiresAuth: true,
    },
    {
      icon: Radio,
      label: 'Live',
      path: '/live-streams',
      requiresAuth: true,
    },
    {
      icon: Store,
      label: 'Shop',  
      path: '/marketplace',
    },
    {
      icon: User,
      label: 'Profile',
      path: user ? (userRole === 'sponsor' ? '/brand-profile' : '/universal-profile') : '/sign-in',
    }
  ];

  const handleNavigation = async (path: string) => {
    if (isNative) {
      await hapticImpact(ImpactStyle.Light);
    }
    navigate(path);
  };

  const isActivePath = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Don't show mobile nav on auth pages
  if (['/sign-in', '/sign-up', '/auth-callback'].includes(location.pathname)) {
    return null;
  }

  return (
    <>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border">
        <div className="grid grid-cols-5 gap-1 px-2 py-2 safe-area-pb">
          {navigationItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            const showItem = !item.requiresAuth || (item.requiresAuth && user);
            
            if (!showItem) return <div key={index} />; // Empty placeholder
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                className={`
                  flex flex-col items-center justify-center h-16 px-2 py-1 rounded-lg
                  ${isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }
                `}
                onClick={() => handleNavigation(item.path)}
              >
                <div className="relative">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-xs"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span className={`text-xs mt-1 ${isActive ? 'font-medium' : ''}`}>
                  {item.label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button - Only show for creators on dashboard */}
      {user?.user_metadata?.role === 'creator' && 
       (location.pathname === '/creator-dashboard' || location.pathname === '/campaigns') && (
        <div className="fixed bottom-20 right-4 z-40">
          <Button
            size="lg"
            className="h-14 w-14 rounded-full bg-gradient-primary text-white shadow-lg hover:shadow-xl transition-shadow"
            onClick={() => handleNavigation('/campaigns')}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Safe area padding for bottom */}
      <div className="h-20" />
    </>
  );
};

export default MobileNavigation;