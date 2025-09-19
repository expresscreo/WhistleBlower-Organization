import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const Billing = () => {
    const { profile, loading: profileLoading, organizationStatus } = useUserProfile();
    const [billingHistory, setBillingHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const fetchBillingHistory = useCallback(async () => {
        if (!profile || !profile.organization_id) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('billing')
            .select('*')
            .eq('organization_id', profile.organization_id)
            .order('created_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching billing history', description: error.message });
        } else {
            setBillingHistory(data);
        }
        setLoading(false);
    }, [profile, toast]);

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
            <Helmet><title>Billing - WhistleBlower.ng</title></Helmet>
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">Billing</h1>
                {(organizationStatus === 'suspended' || organizationStatus === 'pending_payment') && (
                     <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
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
                <Card>
                    <CardHeader>
                        <CardTitle>Billing History</CardTitle>
                        <CardDescription>View your transaction history and payment statuses.</CardDescription>
                        <div className="mt-4">
                            <Input placeholder="Search by plan, status, or reference..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading || profileLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
                        ) : (
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
                                                    <Button size="sm" onClick={() => toast({ title: 'Feature coming soon!'})}>Pay Now</Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" onClick={() => toast({ title: 'Feature coming soon!'})}>View Receipt</Button>
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
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default Billing;