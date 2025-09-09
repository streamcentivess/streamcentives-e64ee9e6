import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  Target, 
  Gift, 
  Trophy, 
  User, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Music,
  Users,
  BarChart3,
  Mail
} from 'lucide-react';
import streamcentivesLogo from '@/assets/streamcentives-logo.png';

const AppNavigation = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Home', href: '/universal-profile', icon: Home },
    { name: 'Campaigns', href: '/campaigns', icon: Target },
    { name: 'Marketplace', href: '/marketplace', icon: Gift },
    { name: 'Inbox', href: '/inbox', icon: Mail },
    { name: 'Leaderboards', href: '/leaderboards', icon: Trophy },
  ];

  const dashboardItems = [
    { name: 'Fan Dashboard', href: '/fan-dashboard', icon: Users, color: 'text-primary' },
    { name: 'Creator Dashboard', href: '/creator-dashboard', icon: Music, color: 'text-secondary' },
  ];

  const isActive = (href: string) => location.pathname === href;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <Link to="/universal-profile" className="flex items-center gap-3 mr-8">
              <img src={streamcentivesLogo} alt="Streamcentives" className="w-8 h-8 rounded-full" />
              <span className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
                Streamcentives
              </span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Dashboard Links and User Menu */}
          <div className="flex items-center gap-4">
            {/* Dashboard Quick Access */}
            <div className="hidden lg:flex items-center gap-2">
              {dashboardItems.map((item) => (
                <Link key={item.name} to={item.href}>
                  <Button 
                    variant={isActive(item.href) ? "default" : "ghost"} 
                    size="sm"
                    className={isActive(item.href) ? "" : `hover:${item.color}`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name.split(' ')[0]}
                  </Button>
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 hover:bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline-block text-sm font-medium">
                    {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">
                      {user.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link to="/universal-profile" className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Dashboards
                </DropdownMenuLabel>
                
                {dashboardItems.map((item) => (
                  <DropdownMenuItem key={item.name} asChild>
                    <Link to={item.href} className="cursor-pointer">
                      <item.icon className={`h-4 w-4 mr-2 ${item.color}`} />
                      {item.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 py-4">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              ))}
              
              <div className="border-t border-border/40 pt-2 mt-2">
                {dashboardItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? `bg-primary/10 ${item.color}`
                        : `text-muted-foreground hover:${item.color} hover:bg-muted/50`
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AppNavigation;