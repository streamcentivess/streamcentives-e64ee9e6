import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithSpotify: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider useEffect triggered');
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if user has a profile, create one if not
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              if (!profile) {
                await supabase.from('profiles').insert({
                  user_id: session.user.id,
                  display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                  avatar_url: session.user.user_metadata?.avatar_url,
                  email: session.user.email,
                  username: session.user.email?.split('@')[0]?.toLowerCase(),
                });
              }
            } catch (error) {
              console.error('Error handling profile creation:', error);
            }
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Initial session check:', session?.user?.id, error);
      if (error) {
        console.error('Session error:', error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithSpotify = async () => {
    try {
      // Detect if user is on mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'user-read-email user-read-private user-top-read user-read-recently-played playlist-modify-public playlist-modify-private',
          skipBrowserRedirect: isMobile ? false : true, // Use direct redirect on mobile, popup on desktop
        },
      });

      if (error) {
        toast({
          title: 'Authentication Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      // Only handle popup flow for desktop
      if (!isMobile) {
        const url = data?.url;
        if (url) {
          // Open OAuth flow in a popup window to bypass iframe restrictions
          const popup = window.open(
            url,
            'spotify-auth',
            'width=500,height=600,scrollbars=yes,resizable=yes'
          );
          
          if (!popup) {
            toast({
              title: 'Popup Blocked',
              description: 'Please allow popups for authentication to work.',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Authentication Error',
            description: 'Could not start Spotify sign-in flow.',
            variant: 'destructive',
          });
        }
      }
      // For mobile, the browser will handle the redirect automatically
    } catch (error) {
      console.error('Spotify auth error:', error);
      toast({
        title: 'Authentication Error',
        description: 'Failed to connect with Spotify',
        variant: 'destructive',
      });
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Google auth error:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to connect with Google",
        variant: "destructive"
      });
    }
  };

  const signInWithFacebook = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Facebook auth error:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to connect with Facebook",
        variant: "destructive"
      });
    }
  };

  const signInWithApple = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) {
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Apple auth error:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to connect with Apple",
        variant: "destructive"
      });
    }
  };

  const signInWithEmail = async (emailOrUsername: string, password: string) => {
    try {
      const input = emailOrUsername.trim();
      if (!input) {
        const err = new Error('Please enter your username or email');
        toast({
          title: 'Sign In Failed',
          description: err.message,
          variant: 'destructive',
        });
        return { error: err };
      }

      let actualEmail = input;

      // If it's not an email, treat it as a username and look up the email
      if (!input.includes('@')) {
        const normalized = input.toLowerCase();
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email, username')
          .ilike('username', normalized)
          .maybeSingle();

        if (profileError) {
          console.error('Profile lookup error:', profileError);
          toast({
            title: 'Sign In Failed',
            description: 'Error looking up username. Please try again.',
            variant: 'destructive',
          });
          return { error: profileError };
        }

        if (!profile?.email) {
          toast({
            title: 'Username Not Found',
            description:
              "We couldn't find that username. Please check it or try signing in with your email.",
            variant: 'destructive',
          });
          return { error: new Error('Username not found') };
        }

        actualEmail = profile.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: actualEmail.trim(),
        password,
      });

      if (error) {
        toast({
          title: 'Sign In Failed',
          description: error.message,
          variant: 'destructive',
        });
      }

      return { error };
    } catch (error) {
      console.error('Email signin error:', error);
      return { error };
    }
  };
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        toast({
          title: "Sign Up Failed", 
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account created successfully!",
          description: "Welcome! You can now complete your profile setup.",
        });
      }

      return { error };
    } catch (error) {
      console.error('Email signup error:', error);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log('Password reset initiated for:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        console.error('Reset password error:', error);
        toast({
          title: "Reset Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('Reset password email sent successfully');
        toast({
          title: "Reset Link Sent",
          description: "Check your email for a password reset link.",
        });
      }

      return { error };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Sign out initiated');
      const { error } = await supabase.auth.signOut();
      
      // Clear local state regardless of API response
      setSession(null);
      setUser(null);
      
      if (error) {
        console.error('Sign out error:', error);
        // Only show error if it's not a session_not_found error
        if (error.message !== "Session from session_id claim in JWT does not exist") {
          toast({
            title: "Sign Out Error",
            description: error.message,
            variant: "destructive"
          });
        } else {
          console.log('Session already expired, clearing local state');
          toast({
            title: "Signed out successfully",
            description: "You have been signed out of your account.",
          });
        }
      } else {
        console.log('Sign out successful');
        toast({
          title: "Signed out successfully",
          description: "You have been signed out of your account.",
        });
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      // Always clear local state on error
      setSession(null);
      setUser(null);
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithSpotify,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};