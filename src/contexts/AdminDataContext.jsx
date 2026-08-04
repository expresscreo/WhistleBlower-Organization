'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  buildMostWantedAdminItems,
  fetchAllMostWantedLinks,
} from '@/lib/mostWantedStatus';

const AdminDataContext = createContext(null);

export const AdminDataProvider = ({ children }) => {
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState({});
  const { profile } = useAuth();
  const loadingRefs = useRef({});
  const cacheRef = useRef(cache);
  const loadingStateRef = useRef(loading);
  const inFlightRef = useRef({});

  cacheRef.current = cache;
  loadingStateRef.current = loading;

  // Keep fetchData identity stable. Depending on cache/loading state objects
  // recreates every fetcher on each request and retriggers page useEffects.
  const fetchData = useCallback(async (key, fetchFunction, dependencies = []) => {
    const depString = JSON.stringify(dependencies);
    const cacheKey = `${key}_${depString}`;

    if (cacheRef.current[cacheKey] && !loadingStateRef.current[key]) {
      return cacheRef.current[cacheKey];
    }

    if (inFlightRef.current[cacheKey]) {
      return inFlightRef.current[cacheKey];
    }

    if (loadingRefs.current[key]) {
      return new Promise((resolve, reject) => {
        const started = Date.now();
        const checkCache = () => {
          if (cacheRef.current[cacheKey] && !loadingStateRef.current[key]) {
            resolve(cacheRef.current[cacheKey]);
            return;
          }
          if (Date.now() - started > 30000) {
            reject(new Error(`Timed out waiting for ${key}`));
            return;
          }
          setTimeout(checkCache, 50);
        };
        checkCache();
      });
    }

    loadingRefs.current[key] = true;
    setLoading((prev) => ({ ...prev, [key]: true }));

    const request = (async () => {
      try {
        const data = await fetchFunction();
        setCache((prev) => ({ ...prev, [cacheKey]: data }));
        return data;
      } catch (error) {
        const errorMessage = [error?.message, error?.details, error?.hint, error?.code]
          .filter(Boolean)
          .join(' ');
        console.error(`Error fetching data for ${key}:`, errorMessage || error);
        throw error;
      } finally {
        loadingRefs.current[key] = false;
        delete inFlightRef.current[cacheKey];
        setLoading((prev) => ({ ...prev, [key]: false }));
      }
    })();

    inFlightRef.current[cacheKey] = request;
    return request;
  }, []);

  const invalidateCache = useCallback((key) => {
    setCache((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((cacheKey) => {
        if (cacheKey.startsWith(key)) {
          delete next[cacheKey];
        }
      });
      return next;
    });
  }, []);

  const clearCache = useCallback(() => {
    setCache({});
    setLoading({});
    loadingRefs.current = {};
    inFlightRef.current = {};
  }, []);

  const fetchReports = useCallback(async () => {
    if (!profile) throw new Error('Profile not available');

    return fetchData(
      'reports',
      async () => {
        const { data, error } = await supabase.rpc('get_reports_for_user', {
          user_id_param: profile.id,
          user_role_param: profile.user_type,
          organization_id_param: profile.organization_id,
        });

        if (error) throw error;
        const excludedCategories = new Set(['bounty', 'most wanted']);
        const filtered = Array.isArray(data)
          ? data.filter((r) => !excludedCategories.has(String(r.category || '').toLowerCase()))
          : [];
        return filtered;
      },
      [profile?.id, profile?.user_type, profile?.organization_id]
    );
  }, [fetchData, profile?.id, profile?.user_type, profile?.organization_id]);

  const fetchBounties = useCallback(async () => {
    return fetchData('bounties', async () => {
      const { data: bounties, error: bountiesError } = await supabase
        .from('bounties')
        .select('*')
        .eq('is_trashed', false);

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

  const fetchMostWanted = useCallback(async () => {
    return fetchData('mostWanted', async () => {
      const [
        { data: alerts, error: alertsError },
        { data: reports, error: reportsError },
        links,
      ] = await Promise.all([
        supabase
          .from('news')
          .select('*')
          .eq('category', 'most_wanted')
          .order('created_at', { ascending: false }),
        supabase
          .from('reports')
          .select('*')
          .eq('category', 'Most Wanted')
          .eq('is_trashed', false),
        fetchAllMostWantedLinks(supabase),
      ]);

      if (alertsError) throw alertsError;
      if (reportsError) throw reportsError;

      return buildMostWantedAdminItems({
        alerts: alerts || [],
        reports: reports || [],
        links,
      });
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

  const value = useMemo(
    () => ({
      fetchData,
      invalidateCache,
      clearCache,
      loading,
      fetchReports,
      fetchBounties,
      fetchMostWanted,
      fetchTriageData,
      fetchPlans,
      cache,
    }),
    [
      fetchData,
      invalidateCache,
      clearCache,
      loading,
      fetchReports,
      fetchBounties,
      fetchMostWanted,
      fetchTriageData,
      fetchPlans,
      cache,
    ]
  );

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
