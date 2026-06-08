import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import PageHead from '@/components/PageHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, ScanSearch, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminData } from '@/contexts/AdminDataContext';
import PageContentWrapper from '@/components/admin/PageContentWrapper';
import PageHeader from '@/components/admin/PageHeader';
import ReportCardMetaFooter from '@/components/admin/ReportCardMetaFooter';
import { normalizeMostWantedDetails } from '@/lib/mostWantedUtils';

const ITEMS_PER_PAGE = 18;

const toTitleCase = (str) => {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const MostWantedManagement = () => {
  const [allItems, setAllItems] = useState([]);
  const [displayedItems, setDisplayedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: 'all', sortBy: 'newest', type: 'all' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();
  const { fetchMostWanted, loading } = useAdminData();

  const loadMostWantedData = useCallback(async () => {
    try {
      const data = await fetchMostWanted();
      setAllItems(data);
    } catch (error) {
      console.error('Failed to load Most Wanted data:', error);
      setAllItems([]);
    }
  }, [fetchMostWanted]);

  useEffect(() => {
    loadMostWantedData();
  }, [loadMostWantedData]);

  useEffect(() => {
    let filtered = allItems;
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const details = item.item_type === 'alert' ? normalizeMostWantedDetails(item.most_wanted_details) : null;
        const haystack = [
          item.title,
          item.report_id,
          details?.case_reference,
          details?.suspect_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(searchTerm.toLowerCase());
      });
    }
    if (filters.status !== 'all') {
      filtered = filtered.filter((item) => item.status === filters.status);
    }
    if (filters.type !== 'all') {
      filtered = filtered.filter((item) => item.item_type === filters.type);
    }

    const sortDate = (a, b) =>
      new Date(b.created_at || b.submitted_at) - new Date(a.created_at || a.submitted_at);
    if (filters.sortBy === 'newest') filtered.sort(sortDate);
    else filtered.sort((a, b) => -sortDate(a, b));

    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    setDisplayedItems(filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE));
  }, [allItems, searchTerm, filters, currentPage]);

  const handleCardClick = (item) => {
    if (item.item_type === 'alert') {
      router.push(`/admin/most-wanted/${item.id}`);
      return;
    }
    if (item.news_id) {
      router.push(`/admin/most-wanted/${item.news_id}?reportId=${item.id}`);
      return;
    }
    router.push(`/admin/reports/${item.id}`);
  };

  const statusConfig = {
    draft: { progress: 10, color: 'bg-yellow-400', tag: 'bg-yellow-100 text-yellow-800' },
    published: { progress: 60, color: 'bg-purple-400', tag: 'bg-purple-100 text-purple-800' },
    archived: { progress: 100, color: 'bg-gray-500', tag: 'bg-gray-100 text-gray-800' },
    Pending: { progress: 5, color: 'bg-orange-400', tag: 'bg-orange-100 text-orange-800' },
    'Under Review': { progress: 20, color: 'bg-yellow-400', tag: 'bg-yellow-100 text-yellow-800' },
    Assigned: { progress: 40, color: 'bg-blue-400', tag: 'bg-blue-100 text-blue-800' },
    'Under Investigation': { progress: 70, color: 'bg-purple-400', tag: 'bg-purple-100 text-purple-800' },
    Investigation: { progress: 70, color: 'bg-purple-400', tag: 'bg-purple-100 text-purple-800' },
    Resolved: { progress: 100, color: 'bg-green-500', tag: 'bg-green-100 text-green-800' },
    Rejected: { progress: 100, color: 'bg-red-400', tag: 'bg-red-100 text-red-800' },
    Closed: { progress: 100, color: 'bg-gray-500', tag: 'bg-gray-100 text-gray-800' },
  };

  return (
    <>
      <PageHead title="Most Wanted — WhistleBlower.ng" />
      <PageContentWrapper loading={loading.mostWanted} loadingText="Loading Most Wanted alerts and tips...">
        <div className="space-y-8">
          <PageHeader
            title="Most Wanted"
            description="Review published alerts and incoming sighting tips."
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Tabs
              value={filters.type}
              onValueChange={(value) => {
                setFilters((f) => ({ ...f, type: value }));
                setCurrentPage(1);
              }}
              className="h-10 shrink-0"
            >
              <TabsList className="h-10 w-full sm:w-auto bg-secondary p-1 items-stretch">
                <TabsTrigger value="all" className="h-full px-3">All</TabsTrigger>
                <TabsTrigger value="alert" className="h-full px-3">Alerts</TabsTrigger>
                <TabsTrigger value="report" className="h-full px-3">Sighting Tips</TabsTrigger>
              </TabsList>
            </Tabs>
            <Input
              className="h-10 flex-1 min-w-0"
              placeholder="Search by alert title, case reference, or report ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={filters.status} onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
              <SelectTrigger className="h-10 w-full sm:w-[160px] shrink-0">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.keys(statusConfig).map((key) => (
                  <SelectItem key={key} value={key}>
                    {toTitleCase(key)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayedItems.map((item) => {
              const isAlert = item.item_type === 'alert';
              const details = isAlert ? normalizeMostWantedDetails(item.most_wanted_details) : null;
              const currentStatus = statusConfig[item.status] || {
                progress: 0,
                color: 'bg-gray-400',
                tag: 'bg-gray-100 text-gray-800',
              };
              const attachmentCount = Array.isArray(item.evidence_path || item.published_evidence)
                ? (item.evidence_path || item.published_evidence).length
                : 0;

              return (
                <Card
                  key={`${item.item_type}-${item.id}`}
                  className="flex flex-col hover:shadow-lg transition-shadow bg-card cursor-pointer rounded-none"
                  onClick={() => handleCardClick(item)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={cn('text-xs font-semibold px-2.5 py-1 flex items-center', currentStatus.tag)}>
                          {isAlert ? <ScanSearch className="w-3 h-3 mr-1.5" /> : <FileText className="w-3 h-3 mr-1.5" />}
                          {toTitleCase(item.status)}
                        </span>
                        {isAlert && item.linked_report_count > 0 && (
                          <span
                            className={cn('text-xs font-semibold px-2.5 py-1 shrink-0', currentStatus.tag)}
                            title={`${item.linked_report_count} sighting tip${item.linked_report_count === 1 ? '' : 's'}`}
                          >
                            {item.linked_report_count}
                          </span>
                        )}
                      </div>
                      <MessageSquare className="w-5 h-5 text-primary hover:text-primary/80 shrink-0" />
                    </div>
                    <CardTitle className="text-sm font-semibold uppercase text-muted-foreground pt-2">
                      {isAlert
                        ? `Case Ref: ${details?.case_reference || 'Pending'}`
                        : `Report ID: ${item.report_id}`}
                    </CardTitle>
                    <div className="w-full bg-muted h-2.5 my-1 overflow-hidden">
                      <div
                        className={cn('h-2.5', currentStatus.color)}
                        style={{ width: `${currentStatus.progress}%` }}
                      />
                    </div>
                    <div className="text-right text-xs font-medium text-muted-foreground">
                      {currentStatus.progress}% complete
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-3">
                    <h3 className="text-lg font-bold line-clamp-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {isAlert ? details?.summary || item.content : item.description}
                    </p>
                  </CardContent>
                  <ReportCardMetaFooter
                    company={isAlert ? 'Most Wanted Alert' : 'Sighting Tip'}
                    companyLabel="Type"
                    companyHighlight={isAlert ? 'red' : 'green'}
                    urgency={isAlert ? 'High' : item.urgency}
                    incidentDate={item.incident_date || item.created_at}
                    attachmentCount={attachmentCount}
                  />
                </Card>
              );
            })}
          </div>

          {displayedItems.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <ScanSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No items match the current filters.</p>
              <p className="text-sm">Try adjusting your search criteria.</p>
            </div>
          )}
        </div>
      </PageContentWrapper>
    </>
  );
};

export default MostWantedManagement;
