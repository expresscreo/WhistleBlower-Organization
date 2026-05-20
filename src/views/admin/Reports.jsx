import { useRouter } from 'next/navigation';
import { useQueryParams } from '@/hooks/useQueryParams';
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, MessageSquare, Building, Calendar, Paperclip, ChevronLeft, ChevronRight, FileUp, Mic, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useAdminData } from '@/contexts/AdminDataContext';
import PageContentWrapper from '@/components/admin/PageContentWrapper';
import PageHeader from '@/components/admin/PageHeader';

const REPORTS_PER_PAGE = 18;

const Reports = () => {
  const [allReports, setAllReports] = useState([]);
  const [displayedReports, setDisplayedReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useQueryParams();
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || 'all',
    category: searchParams.get('category') || 'all',
    sortBy: 'newest',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();
  const { profile, loading: profileLoading } = useAuth();
  const { fetchReports, loading } = useAdminData();

  const loadReports = useCallback(async () => {
    if (!profile || profileLoading) return;
    
    try {
      const data = await fetchReports();
      setAllReports(data);
    } catch (error) {
      // Error handling is done in the context
      console.error('Failed to load reports:', error);
      setAllReports([]);
    }
  }, [profile, profileLoading, fetchReports]);
  
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    let filtered = allReports;

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


    setTotalPages(Math.ceil(filtered.length / REPORTS_PER_PAGE));
    const startIndex = (currentPage - 1) * REPORTS_PER_PAGE;
    const endIndex = startIndex + REPORTS_PER_PAGE;
    setDisplayedReports(filtered.slice(startIndex, endIndex));

  }, [allReports, searchTerm, filters, currentPage]);

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
      <Helmet><title>Reports - WhistleBlower.ng</title></Helmet>
      <PageContentWrapper loading={loading.reports} loadingText="Loading reports...">
        <div className="space-y-8">
          <PageHeader 
            title="Reports" 
            description="Review, manage, and track all submitted reports."
          />
          
          {/* Search, Sort and Filters - Mobile responsive */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Input 
              placeholder="Search by ID or title..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-0"
            />
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
              <Select value={filters.sortBy} onValueChange={(v) => handleFilterChange('sortBy', v)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="updated">Recently Updated</SelectItem>
              </SelectContent>
              </Select>
              <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.keys(statusConfig).map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
              </Select>
              <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v)}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Fraud">Fraud</SelectItem>
                <SelectItem value="Corruption">Corruption</SelectItem>
                <SelectItem value="Misconduct">Misconduct</SelectItem>
                <SelectItem value="Harassment">Harassment</SelectItem>
                <SelectItem value="Safety Violation">Safety Violation</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reports Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {displayedReports.map(report => {
                      const currentStatus = statusConfig[report.status] || { progress: 0, color: 'bg-gray-400', tag: 'bg-gray-100 text-gray-800' };
                      
                      return (
                          <Card key={report.id} className="flex flex-col hover:shadow-lg transition-shadow bg-card cursor-pointer" onClick={() => handleCardClick(report.id)}>
                             <CardHeader className="pb-4">
                                 <div className="flex justify-between items-start gap-2">
                                    <span className={cn('text-xs font-semibold px-2.5 py-1 flex items-center', currentStatus.tag)}>
                                      {report.is_voice_note && <Mic className="w-3 h-3 mr-1.5" />}
                                      {report.status}
                                    </span>
                                    <div className="relative">
                                       <MessageSquare className="w-5 h-5 text-primary hover:text-primary/80"/>
                                       {report.has_new_messages && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full bg-red-500 opacity-75"></span><span className="relative inline-flex h-3 w-3 bg-red-600"></span></span>}
                                    </div>
                                 </div>
                                 <CardTitle className="text-sm font-semibold uppercase text-muted-foreground pt-2">Report ID: {report.report_id}</CardTitle>
                                 <div className="w-full bg-muted h-2.5 my-1">
                                    <div className={cn('h-2.5', currentStatus.color)} style={{ width: `${currentStatus.progress}%` }}></div>
                                 </div>
                                 <div className="text-right text-xs font-medium text-muted-foreground">{currentStatus.progress}% complete</div>
                             </CardHeader>
                             <CardContent className="flex-grow space-y-3">
                                 <h3 className="text-lg font-bold line-clamp-1">{report.title}</h3>
                                 <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                             </CardContent>
                             <div className="p-4 pt-2 border-t mt-2">
                                 <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                     <div className="flex items-center gap-2"><Building className="w-4 h-4 text-primary"/><span className="font-semibold text-muted-foreground line-clamp-1">{report.organization_name}</span></div>
                                     <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary"/><span className="font-semibold text-muted-foreground">{report.incident_date ? format(new Date(report.incident_date), 'MM/dd/yyyy') : 'N/A'}</span></div>
                                     <div className="flex items-center gap-2"><FileUp className="w-4 h-4 text-primary"/><span className="font-semibold text-muted-foreground">{report.created_at ? format(new Date(report.created_at), 'MM/dd/yyyy') : 'N/A'}</span></div>
                                     <div className="flex items-center gap-2"><Paperclip className="w-4 h-4 text-primary"/><span className="font-semibold text-muted-foreground">{report.attachment_count} attachment(s)</span></div>
                                 </div>
                             </div>
                          </Card>
                      )
                  })}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}

            {/* Empty State */}
            {displayedReports.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No reports match the current filters.</p>
                <p className="text-sm">Try adjusting your search criteria.</p>
              </div>
            )}
        </div>
      </PageContentWrapper>
    </>
  );
};

export default Reports;