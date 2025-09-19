import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const useUserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [organizationStatus, setOrganizationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*, plans(name), organizations(status)')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setProfile(null);
          setOrganizationStatus(null);
        } else {
          const userProfile = {
            ...data,
            plan_name: data.plans?.name,
          };
          setProfile(userProfile);
          setOrganizationStatus(data.organizations?.status);
        }
      } catch (e) {
        console.error('Error in fetchProfile:', e);
        setProfile(null);
        setOrganizationStatus(null);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading, fetchProfile]);

  return { profile, organizationStatus, loading: authLoading || loading };
};