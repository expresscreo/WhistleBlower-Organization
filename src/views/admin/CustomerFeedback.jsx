import { useRouter } from 'next/navigation';
import { useQueryParams } from '@/hooks/useQueryParams';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PageHead from '@/components/PageHead';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { PageErrorBanner } from '@/components/ui/form-feedback';
import { Loader2, MessageSquare, ChevronLeft, ChevronRight, Mic } from 'lucide-react';
import NavbarLoader from '@/components/admin/NavbarLoader';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/hooks/useUserProfile';
import PageHeader from '@/components/admin/PageHeader';
import ReportCardMetaFooter from '@/components/admin/ReportCardMetaFooter';

const FEEDBACK_PER_PAGE = 18;

const CustomerFeedback = () => {
  const [allFeedback, setAllFeedback] = useState([]);
  const [displayedFeedback, setDisplayedFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useQueryParams();
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    category: searchParams.get('category') || 'all',
    sortBy: 'newest',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetchError, setFetchError] = useState('');
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();
  
  // Refs to prevent unnecessary re-fetching
  const hasInitialData = useRef(false);
  const lastFetchTime = useRef(0);
  const fetchFeedbackRef = useRef(null);

  const fetchFeedback = useCallback(async (forceRefresh = false) => {
    console.log('fetchFeedback called:', { forceRefresh, hasData: hasInitialData.current, profileId: profile?.id });
    
    if (!profile) return;
    
    // Prevent unnecessary re-fetching
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;
    
    // If we already have data and it's been less than 30 seconds, don't fetch again unless forced
    if (hasInitialData.current && timeSinceLastFetch < 30000 && !forceRefresh) {
      console.log('Skipping fetch - too soon since last fetch');
      return;
    }
    
    // Skip fetch if page is not visible and not forced
    if (!forceRefresh && document.visibilityState !== 'visible') {
      console.log('Skipping fetch - page not visible');
      return;
    }
    
    console.log('Actually fetching feedback...');
    setLoading(true);
    setFetchError('');
    lastFetchTime.current = now;

    let query = supabase
      .from('reports')
      .select(`
        id, report_id, title, description, status, category, incident_date, urgency, admin_has_viewed, is_trashed, created_at, evidence_path, is_voice_note, is_feedback,
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
      setFetchError(error.message);
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
        hasInitialData.current = true;
    }
    setLoading(false);
  }, [profile]);

  // Store the latest fetchFeedback in ref
  fetchFeedbackRef.current = fetchFeedback;
  
  // Initial data fetch - only runs once when profile is loaded
  useEffect(() => {
    if (!profileLoading && profile && !hasInitialData.current) {
        fetchFeedback(true); // Force initial fetch
    }
  }, [profileLoading, profile?.id]); // Only depend on profile.id, not the entire profile object

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
    router.push(`/admin/reports/${reportId}`);
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
      <PageHead title="Customer Feedback — WhistleBlower.ng" />
      {(loading || profileLoading) && <NavbarLoader />}
      <div className="space-y-8">
        <PageHeader 
          title="Customer Feedback" 
          description="Review, manage, and track all submitted customer feedback."
        />

        <PageErrorBanner error={fetchError} title="Could not load feedback" />
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input className="flex-1 min-w-0" placeholder="Search by ID or title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
            <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Statuses</SelectItem>
                {Object.keys(statusConfig).map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.sortBy} onValueChange={(v) => handleFilterChange('sortBy', v)}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="updated">Recently Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Feedback Grid */}
            {loading || profileLoading ? (
                <div className="flex justify-center py-8">
                    {/* Loading indication is handled by NavbarLoader */}
                </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                             <ReportCardMetaFooter
                                 company={feedback.organizations?.name || feedback.organization_name}
                                 urgency={feedback.urgency}
                                 incidentDate={feedback.incident_date}
                                 attachmentCount={feedback.attachment_count}
                             />
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
            
            {/* Empty State */}
            {!loading && !profileLoading && displayedFeedback.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No feedback entries match the current filters.</p>
                <p className="text-sm">Try adjusting your search criteria.</p>
              </div>
            )}
      </div>
    </>
  );
};

export default CustomerFeedback;