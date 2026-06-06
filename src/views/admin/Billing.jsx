import React, { useState, useEffect, useCallback } from 'react';
import PageHead from '@/components/PageHead';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/customSupabaseClient';
import { FieldSuccess, PageErrorBanner } from '@/components/ui/form-feedback';
import { format } from 'date-fns';
import { Loader2, AlertCircle } from 'lucide-react';
import NavbarLoader from '@/components/admin/NavbarLoader';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/admin/PageHeader';

const Billing = () => {
    const { profile, loading: profileLoading, organizationStatus } = useUserProfile();
    const [billingHistory, setBillingHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [fetchError, setFetchError] = useState('');
    const [actionNotice, setActionNotice] = useState('');

    const fetchBillingHistory = useCallback(async () => {
        if (!profile || !profile.organization_id) return;
        setLoading(true);
        setFetchError('');
        const { data, error } = await supabase
            .from('billing')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false });

        if (error) {
            setFetchError(error.message);
        } else {
            setBillingHistory(data);
        }
        setLoading(false);
    }, [profile]);

    useEffect(() => {
        if (!profileLoading && profile) {
            fetchBillingHistory();
        }
    }, [profileLoading, profile, fetchBillingHistory]);

    const filteredHistory = billingHistory.filter(item =>
        item.plan_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.paystack_ref.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const statusVariant = {
        paid: 'success',
        pending: 'secondary',
        failed: 'destructive',
    };
    
    return (
        <>
            <PageHead title="Billing - WhistleBlower.ng" />
            <div className="space-y-8">
                <PageHeader 
                    title="Billing"
                    description="View your billing history and manage payments."
                />

                <PageErrorBanner error={fetchError} title="Could not load billing history" />

                {(organizationStatus === 'suspended' || organizationStatus === 'pending_payment') && (
                     <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-[#2e2e2e]">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <AlertCircle className="h-8 w-8 text-yellow-500"/>
                            <div>
                                <CardTitle className="text-yellow-800 dark:text-yellow-300">
                                    {organizationStatus === 'suspended' ? 'Account Suspended' : 'Payment Pending'}
                                </CardTitle>
                                <CardDescription className="text-yellow-700 dark:text-yellow-400">
                                    Your subscription requires payment. Please renew your plan to restore full access to the dashboard features.
                                </CardDescription>
                            </div>
                        </CardHeader>
                     </Card>
                )}
                {/* Search */}
                <Input placeholder="Search by plan, status, or reference..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <FieldSuccess message={actionNotice} className="text-left" />
                
                {/* Billing History Table */}
                <Card>
                    <CardContent>
                        {loading || profileLoading ? (
                            <>
                                <NavbarLoader />
                                <div className="flex justify-center py-8">
                                    {/* Loading indication is handled by NavbarLoader */}
                                </div>
                            </>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredHistory.length > 0 ? filteredHistory.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{format(new Date(item.created_at), 'PPP')}</TableCell>
                                            <TableCell className="font-medium">{item.plan_name}</TableCell>
                                            <TableCell>₦{(item.amount / 100).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariant[item.status.toLowerCase()] || 'default'} className="capitalize">{item.status}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{item.paystack_ref}</TableCell>
                                            <TableCell>
                                                {item.status.toLowerCase() === 'pending' ? (
                                                    <Button size="sm" onClick={() => setActionNotice('Pay Now is coming soon.')} className="uppercase">Pay Now</Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" onClick={() => setActionNotice('View Receipt is coming soon.')} className="uppercase">View Receipt</Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan="6" className="text-center py-8">No billing records found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default Billing;