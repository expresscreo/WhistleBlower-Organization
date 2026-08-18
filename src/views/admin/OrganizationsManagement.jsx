import Link from 'next/link';
import React, { useState, useCallback } from 'react';
import PageHead from '@/components/PageHead';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Ban, CheckCircle, ChevronDown, Loader2, QrCode, Link2Off, MessageSquare } from 'lucide-react';
import NavbarLoader from '@/components/admin/NavbarLoader';
import { supabase } from '@/lib/customSupabaseClient';
import { FieldError, FieldSuccess, PageErrorBanner } from '@/components/ui/form-feedback';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QRCode from 'qrcode';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '@/components/admin/PageHeader';
import { useLoadOnce, useLoadOnDeps } from '@/hooks/useLoadOnce';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const statusVariants = {
    active: "success",
    suspended: "destructive",
    pending_payment: "secondary"
};

const PLAN_HIERARCHY = [
    'Basic',
    'Professional',
    'Enterprise',
    'Enterprise Plus',
    'Executive',
    'Ultimate',
];

const sortPlansByHierarchy = (plans) => {
    return [...plans].sort((a, b) => {
        const aIndex = PLAN_HIERARCHY.findIndex(
            (name) => name.toLowerCase() === a.name?.toLowerCase()
        );
        const bIndex = PLAN_HIERARCHY.findIndex(
            (name) => name.toLowerCase() === b.name?.toLowerCase()
        );
        const aRank = aIndex === -1 ? PLAN_HIERARCHY.length : aIndex;
        const bRank = bIndex === -1 ? PLAN_HIERARCHY.length : bIndex;
        if (aRank !== bRank) return aRank - bRank;
        const aPrice = Number(a.price) || 0;
        const bPrice = Number(b.price) || 0;
        if (aPrice !== bPrice) return aPrice - bPrice;
        return (a.name || '').localeCompare(b.name || '');
    });
};

const OrganizationsManagement = () => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [qrTitle, setQrTitle] = useState('');
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [plans, setPlans] = useState([]);
    const [fetchError, setFetchError] = useState('');
    const [formFeedback, setFormFeedback] = useState({ error: '', success: '' });
    const [deleteFeedback, setDeleteFeedback] = useState({ error: '', success: '' });
    const [usersExpandError, setUsersExpandError] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [expandedOrgId, setExpandedOrgId] = useState(null);
    const [orgUsers, setOrgUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    const fetchOrganizations = useCallback(async () => {
        setLoading(true);
        setFetchError('');
        let query = supabase.from('organizations').select('id, name, status, created_at, plans(id, name, report_limit)');
        if (searchTerm) {
            query = query.ilike('name', `%${searchTerm}%`);
        }

        const { data, error } = await query;
        if (error) {
            setFetchError(error.message);
        } else {
            const today = new Date();
            const start = startOfMonth(today);
            const end = endOfMonth(today);

            const orgsWithReportCount = await Promise.all(data.map(async (org) => {
                const { count, error: countError } = await supabase
                    .from('reports')
                    .select('id', { count: 'exact' })
                    .eq('organization_id', org.id)
                    .gte('created_at', start.toISOString())
                    .lte('created_at', end.toISOString());
                
                return { ...org, reports_used_this_month: countError ? 0 : count };
            }));
            // Filter organizations based on selected filters
            let filteredOrgs = orgsWithReportCount;
            
            if (selectedPlan !== 'all') {
                filteredOrgs = filteredOrgs.filter(org => org.plans?.name === selectedPlan);
            }
            
            if (selectedStatus !== 'all') {
                filteredOrgs = filteredOrgs.filter(org => org.status === selectedStatus);
            }
            
            // Sort by name by default
            filteredOrgs.sort((a, b) => a.name.localeCompare(b.name));
            
            setOrganizations(filteredOrgs);
        }
        setLoading(false);
    }, [searchTerm, selectedPlan, selectedStatus]);

    const { reload: reloadOrganizations } = useLoadOnDeps(true, fetchOrganizations, [
      searchTerm,
      selectedPlan,
      selectedStatus,
    ]);

    const loadPlans = useCallback(async () => {
      const { data, error } = await supabase.from('plans').select('id, name, price');
      if (!error) setPlans(sortPlansByHierarchy(data || []));
    }, []);

    useLoadOnce(true, loadPlans);

    const toggleExpand = async (orgId) => {
        if (expandedOrgId === orgId) {
            setExpandedOrgId(null);
        } else {
            setExpandedOrgId(orgId);
            setLoadingUsers(true);
            const { data, error } = await supabase.from('users').select('id, name, email, user_type').eq('organization_id', orgId);
            if (error) {
                setUsersExpandError(error.message);
                setOrgUsers([]);
            } else {
                setUsersExpandError('');
                setOrgUsers(data);
            }
            setLoadingUsers(false);
        }
    };

    const handleAdd = () => {
        setFormFeedback({ error: '', success: '' });
        setSelectedOrg({ name: '', plan_id: '', status: 'active' });
        setIsModalOpen(true);
    };

    const handleEdit = (org) => {
        setFormFeedback({ error: '', success: '' });
        setSelectedOrg({ ...org, plan_id: org.plans.id });
        setIsModalOpen(true);
    };

    const handleDelete = (org) => {
        setDeleteFeedback({ error: '', success: '' });
        setSelectedOrg(org);
        setIsDeleteModalOpen(true);
    };

    const handleGenerateQr = async (org, isFeedback = false) => {
        setSelectedOrg(org);
        const baseUrl = `${window.location.origin}/submit-report?organization_id=${org.id}`;
        const url = isFeedback ? `${baseUrl}&feedback=true` : baseUrl;
        const title = isFeedback ? `Customer Feedback QR for ${org.name}` : `Whistleblower QR for ${org.name}`;
        
        setQrTitle(title);

        try {
            const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2 });
            setQrCodeUrl(dataUrl);
            setIsQrModalOpen(true);
        } catch (err) {
            setFormFeedback({ error: 'Could not generate QR code.', success: '' });
        }
    };

    const downloadQrCode = () => {
        if (!selectedOrg || !qrCodeUrl) return;
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        const fileNameSuffix = qrTitle.includes('Feedback') ? 'Feedback_QR' : 'Whistleblower_QR';
        link.download = `${selectedOrg.name.replace(/\s+/g, '_')}_${fileNameSuffix}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const confirmDelete = async () => {
        if (!selectedOrg) return;
        setDeleteFeedback({ error: '', success: '' });
        setIsDeleting(true);
        const { data, error } = await supabase.functions.invoke('delete-organization', {
            body: { organization_id: selectedOrg.id },
        });

        if (error || data?.error) {
            setDeleteFeedback({ error: error?.message || data?.error, success: '' });
        } else {
            setDeleteFeedback({ error: '', success: 'Organization deleted successfully' });
            reloadOrganizations();
        }
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
        setSelectedOrg(null);
    };

    const handleSave = async () => {
        if (!selectedOrg) return;
        setFormFeedback({ error: '', success: '' });
        const orgData = {
            name: selectedOrg.name,
            plan_id: selectedOrg.plan_id,
            status: selectedOrg.status,
        };

        setIsSaving(true);
        try {
            let error;
            if (selectedOrg.id) {
                ({ error } = await supabase.from('organizations').update(orgData).eq('id', selectedOrg.id));
            } else {
                ({ error } = await supabase.from('organizations').insert(orgData));
            }

            if (error) {
                setFormFeedback({ error: error.message, success: '' });
            } else {
                setFormFeedback({ error: '', success: `Organization ${selectedOrg.id ? 'updated' : 'added'} successfully` });
                reloadOrganizations();
            }
            setIsModalOpen(false);
            setSelectedOrg(null);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <PageHead title="Organizations Management — WhistleBlower.ng" />
            <div className="space-y-8">
                <PageHeader 
                    title="Organizations Management"
                    description="Manage partner organizations and their details."
                >
                    <Link href="/admin/unmatched-organizations">
                        <Button variant="outline"><Link2Off className="mr-2 h-4 w-4" />Review Unmatched</Button>
                    </Link>
                    <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" />Add Organization</Button>
                </PageHeader>

                <PageErrorBanner error={fetchError} title="Could not load organizations" />
                <FieldError message={usersExpandError} />
                
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input 
                        placeholder="Search organizations..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 min-w-0"
                    />
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
                        <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="Filter by Plan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Plans</SelectItem>
                                {plans.map(plan => (
                                    <SelectItem key={plan.id} value={plan.name}>{plan.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                                <SelectItem value="pending_payment">Pending Payment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                {/* Organizations Table */}
                <Card>
                    <CardContent>
                        {loading ? (
                            <>
                                <NavbarLoader />
                                <div className="flex justify-center p-8">
                                    {/* Loading indication is handled by NavbarLoader */}
                                </div>
                            </>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead>COMPANY NAME</TableHead>
                                        <TableHead>PLAN</TableHead>
                                        <TableHead>REPORTS USED (MONTHLY)</TableHead>
                                        <TableHead>STATUS</TableHead>
                                        <TableHead>CREATED AT</TableHead>
                                        <TableHead className="text-right">ACTIONS</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {organizations.map(org => (
                                        <React.Fragment key={org.id}>
                                            <TableRow>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" onClick={() => toggleExpand(org.id)}>
                                                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedOrgId === org.id ? 'rotate-180' : ''}`} />
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="font-medium">{org.name}</TableCell>
                                                <TableCell>{org.plans?.name || 'N/A'}</TableCell>
                                                <TableCell>{org.reports_used_this_month} / {org.plans?.report_limit === 0 ? '∞' : org.plans?.report_limit || 'N/A'}</TableCell>
                                                <TableCell><Badge variant={statusVariants[org.status]} className="rounded-none">{org.status.replace('_', ' ')}</Badge></TableCell>
                                                <TableCell>{format(new Date(org.created_at), 'P')}</TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem onClick={() => handleEdit(org)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleGenerateQr(org, false)}><QrCode className="mr-2 h-4 w-4" />Whistleblower QR</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleGenerateQr(org, true)}><MessageSquare className="mr-2 h-4 w-4" />Customer Feedback QR</DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDelete(org)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                            <AnimatePresence>
                                                {expandedOrgId === org.id && (
                                                    <TableRow>
                                                        <TableCell colSpan={7}>
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-muted/50 p-4">
                                                                <h4 className="font-semibold mb-2">Users in this Organization</h4>
                                                                {loadingUsers ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                                                    orgUsers.length > 0 ? (
                                                                        <ul className="space-y-1">
                                                                            {orgUsers.map(user => (
                                                                                <li key={user.id} className="text-sm"><strong>{user.name}</strong> ({user.email}) - <span className="capitalize">{user.user_type?.replace('_', ' ')}</span></li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : <p className="text-sm text-muted-foreground">No users found for this organization.</p>
                                                                )}
                                                            </motion.div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedOrg?.id ? 'Edit' : 'Add'} Organization</DialogTitle>
                        <DialogDescription>Fill in the details for the organization.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Organization Name</Label>
                            <Input id="name" value={selectedOrg?.name || ''} onChange={(e) => setSelectedOrg({ ...selectedOrg, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plan">Plan</Label>
                            <Select value={selectedOrg?.plan_id || ''} onValueChange={(value) => setSelectedOrg({ ...selectedOrg, plan_id: value })}>
                                <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                                <SelectContent>{plans.map(plan => <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={selectedOrg?.status || 'active'} onValueChange={(value) => setSelectedOrg({ ...selectedOrg, status: value })}>
                                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="pending_payment">Pending Payment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <FieldError message={formFeedback.error} className="mx-6" />
                    <FieldSuccess message={formFeedback.success} className="mx-6" />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSave} loading={isSaving}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>This action cannot be undone. This will permanently delete the organization "{selectedOrg?.name}" and all associated data (users, reports, billing). This is irreversible.</DialogDescription>
                    </DialogHeader>
                    <FieldError message={deleteFeedback.error} className="mx-6" />
                    <FieldSuccess message={deleteFeedback.success} className="mx-6" />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete} loading={isDeleting}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{qrTitle}</DialogTitle>
                        <DialogDescription>Download this QR code for users to scan.</DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center items-center p-4">
                        {qrCodeUrl && <img src={qrCodeUrl} alt={qrTitle} />}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsQrModalOpen(false)}>Close</Button>
                        <Button onClick={downloadQrCode}>Download QR Code</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default OrganizationsManagement;