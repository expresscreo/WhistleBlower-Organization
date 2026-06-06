import React, { useState, useEffect, useCallback, useRef } from 'react';
import PageHead from '@/components/PageHead';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { PageErrorBanner } from '@/components/ui/form-feedback';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import NavbarLoader from '@/components/admin/NavbarLoader';
import { format } from 'date-fns';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/admin/PageHeader';

const LOGS_PER_PAGE = 19;

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [actionFilter, setActionFilter] = useState('all');
  const [availableActions, setAvailableActions] = useState([]);
  const [fetchError, setFetchError] = useState('');
  const { profile, loading: profileLoading } = useUserProfile();
  
  // Refs to prevent unnecessary re-fetching
  const hasInitialData = useRef(false);
  const lastFetchTime = useRef(0);
  const fetchLogsRef = useRef(null);

  const fetchLogs = useCallback(async (forceRefresh = false) => {
    if (!profile) return;
    
    // Prevent unnecessary re-fetching
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;
    
    // If we already have data and it's been less than 30 seconds, don't fetch again unless forced
    if (hasInitialData.current && timeSinceLastFetch < 30000 && !forceRefresh) {
      return;
    }
    
    // Skip fetch if page is not visible and not forced
    if (!forceRefresh && document.visibilityState !== 'visible') {
      return;
    }
    
    setLoading(true);
    setFetchError('');
    lastFetchTime.current = now;

    const from = (currentPage - 1) * LOGS_PER_PAGE;
    const to = from + LOGS_PER_PAGE - 1;

    let query = supabase
      .from('audit_logs')
      .select('id, action, timestamp, users(email)', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(from, to);

    if (profile.user_type !== 'super_admin') {
      query = query.eq('organization_id', profile.organization_id);
    }
    
    if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      setFetchError(error.message);
    } else {
      setLogs(data);
      setTotalPages(Math.ceil(count / LOGS_PER_PAGE));
      hasInitialData.current = true;
    }
    setLoading(false);
  }, [profile, currentPage, actionFilter]);

  // Store the latest fetchLogs in ref
  fetchLogsRef.current = fetchLogs;

  const fetchAvailableActions = useCallback(async (forceRefresh = false) => {
      if (!profile) return;
      
      // Only fetch actions once or when forced
      if (availableActions.length > 0 && !forceRefresh) {
        return;
      }

      let query = supabase.from('audit_logs').select('action', { count: 'exact' });
      
      if (profile.user_type !== 'super_admin') {
          query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;
      
      if (error) {
          setFetchError(error.message);
      } else if (data) {
          const uniqueActions = [...new Set(data.map(item => item.action))];
          setAvailableActions(uniqueActions);
      }
  }, [profile, availableActions.length]);


  // Initial data fetch - only runs when profile is loaded or when page/filter changes
  useEffect(() => {
    if (!profileLoading && profile) {
      // Always fetch logs when page or filter changes (this is expected behavior)
      fetchLogs(true);
      // Only fetch available actions once
      fetchAvailableActions(true);
    }
  }, [profileLoading, profile?.id, currentPage, actionFilter]); // Only depend on stable references and expected changes

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <>
      <PageHead title="Audit Logs — WhistleBlower.ng" />
      <div className="space-y-8">
        <PageHeader 
          title="Audit Logs"
          description="Track important actions performed within the system."
        >
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by action..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {availableActions.map(action => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PageHeader>

        <PageErrorBanner error={fetchError} title="Could not load audit logs" />
        
        {/* Audit Logs Table */}
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <>
                    <NavbarLoader />
                    <TableRow><TableCell colSpan="3" className="text-center h-48">
                      {/* Loading indication is handled by NavbarLoader */}
                    </TableCell></TableRow>
                  </>
                ) : logs.length > 0 ? (
                  logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.timestamp), 'PPP p')}</TableCell>
                      <TableCell>{log.users?.email || 'System'}</TableCell>
                      <TableCell>{log.action}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan="3" className="text-center h-48 text-muted-foreground">No audit logs found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
            </div>
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-8">
                    <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AuditLogs;