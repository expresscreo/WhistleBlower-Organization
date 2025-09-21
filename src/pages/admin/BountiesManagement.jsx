import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Calendar, Paperclip, Award, FileText, Info, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAdminData } from '@/contexts/AdminDataContext';
import PageContentWrapper from '@/components/admin/PageContentWrapper';
import PageHeader from '@/components/admin/PageHeader';

const ITEMS_PER_PAGE = 18;
const MoneyIcon = () => <Banknote className="h-4 w-4" />;

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
    const navigate = useNavigate();
    const { fetchBounties, loading } = useAdminData();

    const loadBountiesData = useCallback(async () => {
        try {
            const data = await fetchBounties();
            setAllItems(data);
        } catch (error) {
            // Error handling is done in the context
            console.error('Failed to load bounties data:', error);
            setAllItems([]);
        }
    }, [fetchBounties]);

    useEffect(() => {
        loadBountiesData();
    }, [loadBountiesData]);

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

        const sortDate = (a, b) => new Date(b.created_at || b.submitted_at) - new Date(a.created_at || a.submitted_at);
        if (filters.sortBy === 'newest') filtered.sort(sortDate);
        else filtered.sort((a, b) => -sortDate(a, b));

        setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        setDisplayedItems(filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE));
    }, [allItems, searchTerm, filters, currentPage]);

    const handleCardClick = (item) => {
        if (item.item_type === 'bounty') {
            navigate(`/admin/bounties/${item.id}`);
        } else {
            navigate(`/admin/reports/${item.id}`);
        }
    };

    const statusConfig = {
        'pending_review': { progress: 10, color: 'bg-yellow-400', tag: 'bg-yellow-100 text-yellow-800' },
        'approved': { progress: 30, color: 'bg-blue-400', tag: 'bg-blue-100 text-blue-800' },
        'published': { progress: 60, color: 'bg-purple-400', tag: 'bg-purple-100 text-purple-800' },
        'resolved': { progress: 100, color: 'bg-green-500', tag: 'bg-green-100 text-green-800' },
        'rejected': { progress: 100, color: 'bg-red-400', tag: 'bg-red-100 text-red-800' },
        'refunded': { progress: 100, color: 'bg-gray-500', tag: 'bg-gray-100 text-gray-800' },
        'Pending': { progress: 5, color: 'bg-orange-400', tag: 'bg-orange-100 text-orange-800' },
        'Under Review': { progress: 20, color: 'bg-yellow-400', tag: 'bg-yellow-100 text-yellow-800' },
        'Assigned': { progress: 40, color: 'bg-blue-400', tag: 'bg-blue-100 text-blue-800' },
        'Under Investigation': { progress: 70, color: 'bg-purple-400', tag: 'bg-purple-100 text-purple-800' },
    };

    return (
        <>
            <Helmet><title>Bounties Management - WhistleBlower.ng</title></Helmet>
            <PageContentWrapper loading={loading.bounties} loadingText="Loading bounties and reports...">
                <div className="space-y-8">
                    <PageHeader 
                        title="Bounties Management" 
                        description="Review placed bounties and incoming reports on them."
                    />
                    
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Input className="flex-1 min-w-0" placeholder="Search by ID or title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
                            <Select value={filters.type} onValueChange={(v) => setFilters(f => ({ ...f, type: v }))}>
                                <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Filter by Type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="bounty">Placed Bounty</SelectItem>
                                    <SelectItem value="report">Bounty Report</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filters.status} onValueChange={(v) => setFilters(f => ({ ...f, status: v }))}>
                                <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Filter by Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {Object.keys(statusConfig).map(key => <SelectItem key={key} value={key}>{toTitleCase(key)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Bounties Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {displayedItems.map(item => {
                                    const isBounty = item.item_type === 'bounty';
                                    const currentStatus = statusConfig[item.status] || { progress: 0, color: 'bg-gray-400', tag: 'bg-gray-100 text-gray-800' };
                                    const attachmentCount = Array.isArray(item.evidence || item.evidence_path) ? (item.evidence || item.evidence_path).length : 0;
                                    const date = item.created_at || item.submitted_at;

                                    return (
                                        <Card key={item.id} className="flex flex-col hover:shadow-lg transition-shadow bg-card cursor-pointer rounded-none" onClick={() => handleCardClick(item)}>
                                            <CardHeader className="pb-4">
                                                <div className="flex justify-between items-start gap-2">
                                                    <span className={cn('text-xs font-semibold px-2.5 py-1 flex items-center', currentStatus.tag)}>
                                                        {isBounty ? <Award className="w-3 h-3 mr-1.5" /> : <FileText className="w-3 h-3 mr-1.5" />}
                                                        {toTitleCase(item.status)}
                                                    </span>
                                                    <MessageSquare className="w-5 h-5 text-primary hover:text-primary/80" />
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
                                            <div className="p-4 pt-2 border-t mt-2">
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                                    <div className="flex items-center gap-2 -ml-4">
                                                        <div className={cn('flex items-center gap-2 font-semibold pl-0 py-1 text-xs relative overflow-hidden', 
                                                            isBounty ? 'bg-red-500 text-white' : 'bg-green-500 text-white')} 
                                                            style={{
                                                                paddingRight: '16px',
                                                                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)'
                                                            }}>
                                                            <Info className="w-4 h-4 ml-4" />
                                                            <span>{isBounty ? 'Placed Bounty' : 'Bounty Report'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /><span className="font-semibold text-muted-foreground">{date ? format(new Date(date), 'MM/dd/yyyy') : 'N/A'}</span></div>
                                                    <div className="flex items-center gap-2"><Paperclip className="w-4 h-4 text-primary" /><span className="font-semibold text-muted-foreground">{attachmentCount} attachment(s)</span></div>
                                                    {isBounty && <div className="flex items-center gap-2 font-semibold text-primary"><Banknote className="w-4 h-4" /><span className="font-black">{item.bounty_amount ? Number(item.bounty_amount).toLocaleString() : 'No Reward'}</span></div>}
                                                </div>
                                            </div>
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