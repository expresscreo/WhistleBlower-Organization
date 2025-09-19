import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LOGS_PER_PAGE = 19;

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [actionFilter, setActionFilter] = useState('all');
  const [availableActions, setAvailableActions] = useState([]);
  const { toast } = useToast();
  const { profile, loading: profileLoading } = useUserProfile();

  const fetchLogs = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

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
      toast({ variant: 'destructive', title: 'Error fetching audit logs', description: error.message });
    } else {
      setLogs(data);
      setTotalPages(Math.ceil(count / LOGS_PER_PAGE));
    }
    setLoading(false);
  }, [toast, profile, currentPage, actionFilter]);

  const fetchAvailableActions = useCallback(async () => {
      if (!profile) return;

      let query = supabase.from('audit_logs').select('action', { count: 'exact' });
      
      if (profile.user_type !== 'super_admin') {
          query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;
      
      if (error) {
          toast({ variant: 'destructive', title: 'Error fetching actions', description: error.message });
      } else if (data) {
          const uniqueActions = [...new Set(data.map(item => item.action))];
          setAvailableActions(uniqueActions);
      }
  }, [profile, toast]);


  useEffect(() => {
    if (!profileLoading) {
      fetchLogs();
      fetchAvailableActions();
    }
  }, [profile, profileLoading, currentPage, actionFilter, fetchLogs, fetchAvailableActions]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <>
      <Helmet><title>Audit Logs - WhistleBlower.ng</title></Helmet>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Activity History</CardTitle>
                    <CardDescription>Track important actions performed within the system.</CardDescription>
                </div>
                <div className="w-1/4">
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger><SelectValue placeholder="Filter by action..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Actions</SelectItem>
                            {availableActions.map(action => (
                                <SelectItem key={action} value={action}>{action}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </CardHeader>
          <CardContent>
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
                  <TableRow><TableCell colSpan="3" className="text-center h-48"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></TableCell></TableRow>
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