import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserAndPermissions = useCallback(async (sessionUser) => {
    if (sessionUser) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*, organization:organizations(name, plan_id)')
          .eq('id', sessionUser.id)
          .single();
        
        if (userError) throw userError;
        
        const userProfile = {
          ...userData,
          plan_id: userData.organization?.plan_id || userData.plan_id,
          organizationName: userData.organization?.name,
          organization_id: userData.organization_id
        };
        setProfile(userProfile);
        
        const { data: permsData, error: permsError } = await supabase
          .from('plan_role_permissions')
          .select('page_name, can_view')
          .eq('plan_id', userProfile.plan_id)
          .eq('role', userProfile.user_type);
        
        if (permsError) throw permsError;

        const userPermissions = permsData.reduce((acc, p) => {
          acc[p.page_name] = p.can_view;
          return acc;
        }, {});
        setPermissions(userPermissions);
        setUser(sessionUser);

      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(sessionUser); // Still set user
        setProfile(null);
        setPermissions({});
      }
    } else {
        setUser(null);
        setProfile(null);
        setPermissions({});
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setLoading(true);
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await fetchUserAndPermissions(session?.user ?? null);
      
      const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        await fetchUserAndPermissions(session?.user ?? null);
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    };
    getSession();
  }, [fetchUserAndPermissions]);

  const value = {
    user,
    profile,
    permissions,
    loading,
    signUp: (email, password, options) => supabase.auth.signUp({ email, password, options }),
    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({
          variant: "destructive",
          title: "Sign in Failed",
          description: error.message || "Something went wrong",
        });
      }
      return { data, error };
    },
    logout: async () => {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setPermissions({});
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};