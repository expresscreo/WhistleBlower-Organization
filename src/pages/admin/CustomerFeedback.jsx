import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, MessageSquare, Building, Calendar, Paperclip, ChevronLeft, ChevronRight, FileUp, Mic } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/hooks/useUserProfile';

const FEEDBACK_PER_PAGE = 18;

const CustomerFeedback = () => {
  const [allFeedback, setAllFeedback] = useState([]);
  const [displayedFeedback, setDisplayedFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    category: searchParams.get('category') || 'all',
    sortBy: 'newest',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { profile, loading: profileLoading } = useUserProfile();

  const fetchFeedback = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    let query = supabase
      .from('reports')
      .select(`
        id, report_id, title, description, status, category, incident_date, admin_has_viewed, is_trashed, created_at, evidence_path, is_voice_note, is_feedback,
        organizations(name),
        report_updates(created_at)
      `)
      .eq('is_trashed', false)
      .eq('is_feedback', true);

    if (profile.user_type !== 'super_admin') {
      query = query.eq('organization_id', profile.organization_id);
    }
    
    const { data, error } = await query;

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching feedback', description: error.message });
      setAllFeedback([]);
    } else {
        let processedFeedback = data.map(r => {
            const hasNewMessages = !r.admin_has_viewed;
            const lastUpdate = r.report_updates.length > 0 ? Math.max(...r.report_updates.map(u => new Date(u.created_at).getTime())) : new Date(r.created_at).getTime();
            return { 
                ...r, 
                attachment_count: Array.isArray(r.evidence_path) ? r.evidence_path.length : 0,
                hasNewMessages,
                last_updated_at: new Date(lastUpdate),
            }
        });
        setAllFeedback(processedFeedback);
    }
    setLoading(false);
  }, [toast, profile]);
  
  useEffect(() => {
    if (!profileLoading && profile) {
      fetchFeedback();
    }
  }, [fetchFeedback, profileLoading, profile]);

  useEffect(() => {
    let filtered = allFeedback;

    if (searchTerm) {
        filtered = filtered.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.report_id.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filters.status !== 'all') filtered = filtered.filter(r => r.status === filters.status);
    if (filters.category !== 'all') filtered = filtered.filter(r => r.category === filters.category);

    if (filters.sortBy === 'newest') {
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (filters.sortBy === 'oldest') {
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    } else if (filters.sortBy === 'updated') {
        filtered.sort((a, b) => new Date(b.last_updated_at) - new Date(a.last_updated_at));
    }

    setTotalPages(Math.ceil(filtered.length / FEEDBACK_PER_PAGE));
    const startIndex = (currentPage - 1) * FEEDBACK_PER_PAGE;
    const endIndex = startIndex + FEEDBACK_PER_PAGE;
    setDisplayedFeedback(filtered.slice(startIndex, endIndex));

  }, [allFeedback, searchTerm, filters, currentPage]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    const params = new URLSearchParams();
    if (newFilters.status !== 'all') params.set('status', newFilters.status);
    if (newFilters.category !== 'all') params.set('category', newFilters.category);
    setSearchParams(params);
  };

  const handleCardClick = async (reportId) => {
    await supabase.from('reports').update({ admin_has_viewed: true }).eq('id', reportId);
    navigate(`/admin/reports/${reportId}`);
  };

  const statusConfig = {
    'Pending': { progress: 5, color: 'bg-orange-400', tag: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' },
    'Under Review': { progress: 20, color: 'bg-yellow-400', tag: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
    'Assigned': { progress: 40, color: 'bg-blue-400', tag: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
    'Under Investigation': { progress: 70, color: 'bg-purple-400', tag: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' },
    'Resolved': { progress: 100, color: 'bg-green-500', tag: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
    'Rejected': { progress: 100, color: 'bg-red-400', tag: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
  };

  return (
    <>
      <Helmet><title>Customer Feedback - WhistleBlower.ng</title></Helmet>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Customer Feedback</h1>
        <Card>
          <CardHeader>
            <CardTitle>All Feedback</CardTitle>
            <CardDescription>Review, manage, and track all submitted customer feedback.</CardDescription>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
              <Input className="lg:col-span-2" placeholder="Search by ID or title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                <SelectTrigger><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Statuses</SelectItem>
                  {Object.keys(statusConfig).map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filters.sortBy} onValueChange={(v) => handleFilterChange('sortBy', v)}>
                <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="updated">Recently Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading || profileLoading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {displayedFeedback.map(feedback => {
                      const currentStatus = statusConfig[feedback.status] || { progress: 0, color: 'bg-gray-400', tag: 'bg-gray-100 text-gray-800' };
                      
                      return (
                          <Card key={feedback.id} className="flex flex-col hover:shadow-lg transition-shadow bg-card cursor-pointer" onClick={() => handleCardClick(feedback.id)}>
                             <CardHeader className="pb-4">
                                 <div className="flex justify-between items-start gap-2">
                                    <span className={cn('text-xs font-semibold px-2.5 py-1 flex items-center', currentStatus.tag)}>
                                      {feedback.is_voice_note && <Mic className="w-3 h-3 mr-1.5" />}
                                      {feedback.status}
                                    </span>
                                    <div className="relative">
                                       <MessageSquare className="w-5 h-5 text-primary hover:text-primary/80"/>
                                       {feedback.hasNewMessages && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full bg-red-500 opacity-75"></span><span className="relative inline-flex h-3 w-3 bg-red-600"></span></span>}
                                    </div>
                                 </div>
                                 <CardTitle className="text-sm font-semibold uppercase text-muted-foreground pt-2">Feedback ID: {feedback.report_id}</CardTitle>
                                 <div className="w-full bg-muted h-2.5 my-1">
                                    <div className={cn('h-2.5', currentStatus.color)} style={{ width: `${currentStatus.progress}%` }}></div>
                                 </div>
                                 <div className="text-right text-xs font-medium text-muted-foreground">{currentStatus.progress}% complete</div>
                             </CardHeader>
                             <CardContent className="flex-grow space-y-3">
                                 <h3 className="text-lg font-bold line-clamp-1">{feedback.title}</h3>
                                 <p className="text-sm text-muted-foreground line-clamp-2">{feedback.description}</p>
                             </CardContent>
                             <div className="p-4 pt-2 border-t mt-2">
                                 <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                     <div className="flex items-center gap-2 bg-[#fcfcfc] dark:bg-secondary p-1"><Building className="w-4 h-4 text-primary"/><span className="font-semibold text-muted-foreground line-clamp-1">{feedback.organizations?.name || feedback.organization_name}</span></div>
                                     <div className="flex items-center gap-2 bg-[#fcfcfc] dark:bg-secondary p-1"><Calendar className="w-4 h-4 text-primary"/><span className="font-semibold text-muted-foreground">{feedback.incident_date ? format(new Date(feedback.incident_date), 'MM/dd/yyyy') : 'N/A'}</span></div>
                                     <div className="flex items-center gap-2 bg-[#fcfcfc] dark:bg-secondary p-1"><FileUp className="w-4 h-4 text-primary"/><span className="font-semibold text-muted-foreground">{feedback.created_at ? format(new Date(feedback.created_at), 'MM/dd/yyyy') : 'N/A'}</span></div>
                                     <div className="flex items-center gap-2 bg-[#fcfcfc] dark:bg-secondary p-1"><Paperclip className="w-4 h-4 text-primary"/><span className="font-semibold text-muted-foreground">{feedback.attachment_count} attachment(s)</span></div>
                                 </div>
                             </div>
                          </Card>
                      )
                  })}
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-4 mt-8">
                    <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                )}
              </>
            )}
            {!loading && !profileLoading && displayedFeedback.length === 0 && <div className="text-center py-8 text-muted-foreground">No feedback entries match the current filters.</div>}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CustomerFeedback;