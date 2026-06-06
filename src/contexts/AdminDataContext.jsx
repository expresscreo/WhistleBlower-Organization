'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AdminDataContext = createContext(null);

export const AdminDataProvider = ({ children }) => {
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState({});
  const { profile } = useAuth();
  const loadingRefs = useRef({});

  const fetchData = useCallback(async (key, fetchFunction, dependencies = []) => {
    // Create a dependency string for cache invalidation
    const depString = JSON.stringify(dependencies);
    const cacheKey = `${key}_${depString}`;
    
    // If data is already cached and dependencies haven't changed, return cached data
    if (cache[cacheKey] && !loading[key]) {
      return cache[cacheKey];
    }

    // Prevent duplicate requests for the same key
    if (loadingRefs.current[key]) {
      // Wait for the existing request to complete
      return new Promise((resolve) => {
        const checkCache = () => {
          if (cache[cacheKey] && !loading[key]) {
            resolve(cache[cacheKey]);
          } else {
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }

    loadingRefs.current[key] = true;
    setLoading(prev => ({ ...prev, [key]: true }));

    try {
      const data = await fetchFunction();
      setCache(prev => ({ ...prev, [cacheKey]: data }));
      return data;
    } catch (error) {
      console.error(`Error fetching data for ${key}:`, error);
      throw error;
    } finally {
      loadingRefs.current[key] = false;
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }, [cache, loading]);

  const invalidateCache = useCallback((key) => {
    setCache(prev => {
      const newCache = { ...prev };
      // Remove all cache entries that start with the key
      Object.keys(newCache).forEach(cacheKey => {
        if (cacheKey.startsWith(key)) {
          delete newCache[cacheKey];
        }
      });
      return newCache;
    });
  }, []);

  const clearCache = useCallback(() => {
    setCache({});
    setLoading({});
    loadingRefs.current = {};
  }, []);

  // Common data fetching functions
  const fetchReports = useCallback(async () => {
    if (!profile) throw new Error('Profile not available');
    
    return fetchData('reports', async () => {
      const { data, error } = await supabase.rpc('get_reports_for_user', {
        user_id_param: profile.id,
        user_role_param: profile.user_type,
        organization_id_param: profile.organization_id
      });
      
      if (error) throw error;
      // Exclude bounty-category submissions from general Reports; they are handled in Bounties
      const filtered = Array.isArray(data) ? data.filter(r => String(r.category || '').toLowerCase() !== 'bounty') : [];
      return filtered;
    }, [profile?.id, profile?.user_type, profile?.organization_id]);
  }, [fetchData, profile]);

  const fetchBounties = useCallback(async () => {
    return fetchData('bounties', async () => {
      const { data: bounties, error: bountiesError } = await supabase
        .from('bounties')
        .select('*')
        .eq('is_trashed', false);
      
      // Only hunter tips explicitly linked to a bounty (via bounty_reports).
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('*, bounty_reports!inner(bounty_id)')
        .eq('category', 'Bounty')
        .eq('is_trashed', false);

      if (bountiesError || reportsError) {
        throw bountiesError || reportsError;
      }

      const formattedReports = (reports || []).map((r) => ({
        ...r,
        item_type: 'report',
        bounty_id: r.bounty_reports?.[0]?.bounty_id ?? r.bounty_id,
      }));

      const linkedReportCountByBounty = formattedReports.reduce((counts, report) => {
        const bountyId = report.bounty_id;
        if (bountyId) {
          counts[bountyId] = (counts[bountyId] || 0) + 1;
        }
        return counts;
      }, {});

      const formattedBounties = bounties.map((b) => ({
        ...b,
        item_type: 'bounty',
        linked_report_count: linkedReportCountByBounty[b.id] || 0,
      }));

      return [...formattedBounties, ...formattedReports];
    }, []);
  }, [fetchData]);

  const fetchTriageData = useCallback(async () => {
    return fetchData('triage', async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('is_trashed', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }, []);
  }, [fetchData]);

  const fetchPlans = useCallback(async () => {
    return fetchData('plans', async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });
      
      if (error) throw error;
      return data;
    }, []);
  }, [fetchData]);

  const value = {
    // Core functions
    fetchData,
    invalidateCache,
    clearCache,
    
    // Loading states
    loading,
    
    // Common data fetchers
    fetchReports,
    fetchBounties,
    fetchTriageData,
    fetchPlans,
    
    // Direct cache access (for advanced usage)
    cache
  };

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) {
    throw new Error('useAdminData must be used within AdminDataProvider');
  }
  return context;
};
