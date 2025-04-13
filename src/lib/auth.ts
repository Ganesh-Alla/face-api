// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabase = createClient();

type AuthState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
};

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Get the initial session
    const initializeAuth = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setAuthState(prev => ({
            ...prev,
            error: sessionError.message,
            isLoading: false
          }));
          return;
        }

        setAuthState(prev => ({ 
          ...prev, 
          session,
          user: session?.user || null,
        }));

        // If we have a user, get their profile
        if (session?.user) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error: unknown) {
        console.error('Auth initialization error:', error);
        setAuthState(prev => ({
          ...prev,
          error: 'Failed to initialize authentication',
          isLoading: false
        }));
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log('Auth state changed:', event);
        
        setAuthState(prev => ({ 
          ...prev, 
          session, 
          user: session?.user || null
        }));

        // On sign out, clear profile
        if (event === 'SIGNED_OUT') {
          setAuthState(prev => ({ 
            ...prev, 
            isLoading: false 
          }));
        }
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);


  async function signOut() {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      return window.location.reload();
      
      // State will be updated by the onAuthStateChange listener
    } catch (error: unknown) {
      console.error('Error signing out:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Something went wrong'
      }));
    }
  }

  async function signInWithGoogle() {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        throw error;
      }

      // State will be updated by redirect and onAuthStateChange listener
    } catch (error: unknown) {
      console.error('Error signing in with Google:', error);
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
      
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: error instanceof Error ? error.message : 'Something went wrong'
      }));
    }
  }

  return {
    session: authState.session,
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    signInWithGoogle,
    signOut,
  };
}