import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import PageHead from '@/components/PageHead';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Award, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminData } from '@/contexts/AdminDataContext';
import PageContentWrapper from '@/components/admin/PageContentWrapper';
import PageHeader from '@/components/admin/PageHeader';
import ReportCardMetaFooter from '@/components/admin/ReportCardMetaFooter';
import { useLoadOnce } from '@/hooks/useLoadOnce';
import { compareAdminUnread, isAdminUnreadItem } from '@/lib/adminUnread';

const ITEMS_PER_PAGE = 18;

const toTitleCase = (str) => {
    if (!str) return '';
    return str.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const BountiesManagement = () => {
    const [allItems, setAllItems] = useState([]);
    const [displayedItems, setDisplayedItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: 'all', sortBy: 'newest', type: 'all' });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const router = useRouter();
    const { fetchBounties, loading } = useAdminData();

    const loadBountiesData = useCallback(async () => {
        try {
            const data = await fetchBounties();
            setAllItems(data);
        } catch (error) {
            console.error('Failed to load bounties data:', error);
            setAllItems([]);
        }
    }, [fetchBounties]);

    useLoadOnce(true, loadBountiesData);

    useEffect(() => {
        let filtered = allItems;
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (item.item_type === 'bounty' && item.bounty_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.item_type === 'report' && item.report_id.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        if (filters.status !== 'all') filtered = filtered.filter(item => item.status === filters.status);
        if (filters.type !== 'all') filtered = filtered.filter(item => item.item_type === filters.type);
        if (filters.sortBy === 'unread') filtered = filtered.filter(isAdminUnreadItem);

        const sortDate = (a, b) => new Date(b.created_at || b.submitted_at) - new Date(a.created_at || a.submitted_at);
        if (filters.sortBy === 'newest') filtered.sort(sortDate);
        else if (filters.sortBy === 'oldest') filtered.sort((a, b) => -sortDate(a, b));
        else if (filters.sortBy === 'unread') filtered.sort(compareAdminUnread);

        setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        setDisplayedItems(filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE));
    }, [allItems, searchTerm, filters, currentPage]);

    const handleCardClick = (item) => {
        // Route placed bounties to bounty details.
        // Route bounty reports to the related bounty details page and pass reportId.
        if (item.item_type === 'bounty') {
            router.push(`/admin/bounties/${item.id}`);
        } else if (item.item_type === 'report' && item.bounty_id) {
            router.push(`/admin/bounties/${item.bounty_id}?reportId=${item.id}`);
        } else {
            router.push(`/admin/reports/${item.id}`);
        }
    };

    const statusConfig = {
        'pending_review': { progress: 10, color: 'bg-yellow-400', tag: 'bg-yellow-100 text-yellow-800' },
        'approved': { progress: 30, color: 'bg-blue-400', tag: 'bg-blue-100 text-blue-800' },
        'published': { progress: 60, color: 'bg-purple-400', tag: 'bg-purple-100 text-purple-800' },
        'report_received': { progress: 75, color: 'bg-orange-400', tag: 'bg-orange-100 text-orange-800' },
        'resolved': { progress: 100, color: 'bg-green-500', tag: 'bg-green-100 text-green-800' },
        'rejected': { progress: 100, color: 'bg-red-400', tag: 'bg-red-100 text-red-800' },
        'refunded': { progress: 100, color: 'bg-gray-500', tag: 'bg-gray-100 text-gray-800' },
        'Pending': { progress: 5, color: 'bg-orange-400', tag: 'bg-orange-100 text-orange-800' },
        'Under Review': { progress: 20, color: 'bg-yellow-400', tag: 'bg-yellow-100 text-yellow-800' },
        'Assigned': { progress: 40, color: 'bg-blue-400', tag: 'bg-blue-100 text-blue-800' },
        'Under Investigation': { progress: 70, color: 'bg-purple-400', tag: 'bg-purple-100 text-purple-800' },
        'Investigation': { progress: 70, color: 'bg-purple-400', tag: 'bg-purple-100 text-purple-800' },
        'Closed': { progress: 100, color: 'bg-gray-500', tag: 'bg-gray-100 text-gray-800' },
    };

    return (
        <>
            <PageHead title="Bounties Management — WhistleBlower.ng" />
            <PageContentWrapper loading={loading.bounties} loadingText="Loading bounties and reports...">
                <div className="space-y-8">
                    <PageHeader 
                        title="Bounties Management" 
                        description="Review placed bounties and incoming reports on them."
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
                                <TabsTrigger value="bounty" className="h-full px-3">Placed Bounties</TabsTrigger>
                                <TabsTrigger value="report" className="h-full px-3">Bounty Reports</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Input className="h-10 flex-1 min-w-0" placeholder="Search by ID or title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <Select value={filters.sortBy} onValueChange={(v) => setFilters(f => ({ ...f, sortBy: v }))}>
                            <SelectTrigger className="h-10 w-full sm:w-[160px] shrink-0"><SelectValue placeholder="Sort by" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                                <SelectItem value="unread">Unread Only</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
                            <SelectTrigger className="h-10 w-full sm:w-[160px] shrink-0"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {Object.keys(statusConfig).map(key => <SelectItem key={key} value={key}>{toTitleCase(key)}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Bounties Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {displayedItems.map(item => {
                                    const isBounty = item.item_type === 'bounty';
                                    const currentStatus = statusConfig[item.status] || { progress: 0, color: 'bg-gray-400', tag: 'bg-gray-100 text-gray-800' };
                                    const attachmentCount = Array.isArray(item.evidence || item.evidence_path) ? (item.evidence || item.evidence_path).length : 0;

                                    return (
                                        <Card key={`${item.item_type}-${item.id}`} className="flex flex-col hover:shadow-lg transition-shadow bg-card cursor-pointer rounded-none" onClick={() => handleCardClick(item)}>
                                            <CardHeader className="pb-4">
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className={cn('text-xs font-semibold px-2.5 py-1 flex items-center', currentStatus.tag)}>
                                                            {isBounty ? <Award className="w-3 h-3 mr-1.5" /> : <FileText className="w-3 h-3 mr-1.5" />}
                                                            {toTitleCase(item.status)}
                                                        </span>
                                                        {isBounty && item.linked_report_count > 0 && (
                                                            <span
                                                                className={cn('text-xs font-semibold px-2.5 py-1 shrink-0', currentStatus.tag)}
                                                                title={`${item.linked_report_count} hunter report${item.linked_report_count === 1 ? '' : 's'}`}
                                                            >
                                                                {item.linked_report_count}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="relative shrink-0">
                                                        <MessageSquare className="w-5 h-5 text-primary hover:text-primary/80" />
                                                        {isAdminUnreadItem(item) && (
                                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                                <span className="animate-ping absolute inline-flex h-full w-full bg-red-500 opacity-75"></span>
                                                                <span className="relative inline-flex h-3 w-3 bg-red-600"></span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <CardTitle className="text-sm font-semibold uppercase text-muted-foreground pt-2">
                                                    {isBounty ? `Bounty ID: ${item.bounty_id}` : `Report ID: ${item.report_id}`}
                                                </CardTitle>
                                                <div className="w-full bg-muted h-2.5 my-1 overflow-hidden">
                                                    <div className={cn('h-2.5', currentStatus.color)} style={{ width: `${currentStatus.progress}%` }}></div>
                                                </div>
                                                <div className="text-right text-xs font-medium text-muted-foreground">{currentStatus.progress}% complete</div>
                                            </CardHeader>
                                            <CardContent className="flex-grow space-y-3">
                                                <h3 className="text-lg font-bold line-clamp-1">{item.title}</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                                            </CardContent>
                                            <ReportCardMetaFooter
                                                company={isBounty ? 'Placed Bounty' : 'Bounty Report'}
                                                companyLabel="Type"
                                                companyHighlight={isBounty ? 'red' : 'green'}
                                                urgency={isBounty ? 'High' : item.urgency}
                                                incidentDate={isBounty ? (item.incident_date || item.created_at) : (item.incident_date || item.created_at || item.submitted_at)}
                                                attachmentCount={attachmentCount}
                                            />
                                        </Card>
                                    );
                                })}
                        </div>

                        {/* Empty State */}
                        {displayedItems.length === 0 && (
                            <div className="text-center py-16 text-muted-foreground">
                                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">No items match the current filters.</p>
                                <p className="text-sm">Try adjusting your search criteria.</p>
                            </div>
                        )}
                </div>
            </PageContentWrapper>
        </>
    );
};

export default BountiesManagement;