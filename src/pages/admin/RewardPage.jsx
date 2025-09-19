import React, { useState, useEffect, useCallback } from 'react';
    import { Helmet } from 'react-helmet';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
    import { Loader2, Wallet } from 'lucide-react';
    import { format } from 'date-fns';
    
    const RewardPage = () => {
      const { profile } = useAuth();
      const { toast } = useToast();
      const [loading, setLoading] = useState(true);
      const [data, setData] = useState({
        wallet: null,
        walletTransactions: [],
        resolvedReports: [],
        pendingRewards: [],
        paidRewards: [],
        rejectedRewards: [],
        orgSummary: [],
        allPendingRewards: [],
        auditLog: [],
      });
      const [rewardAmounts, setRewardAmounts] = useState({});
    
      const fetchData = useCallback(async () => {
        setLoading(true);
        try {
          if (profile.user_type === 'super_admin') {
            const { data: orgSummary, error: orgSummaryError } = await supabase.from('organizations').select('id, name, organization_wallets(balance)');
            if (orgSummaryError) throw orgSummaryError;
    
            const { data: allPendingRewards, error: allPendingRewardsError } = await supabase.from('reports').select('*, organizations(name)').eq('reward_status', 'pending_request');
            if (allPendingRewardsError) throw allPendingRewardsError;
    
            const { data: auditLog, error: auditLogError } = await supabase.from('wallet_transactions').select('*, wallet:organization_wallets(organization:organizations(name)), report:reports(report_id)');
            if (auditLogError) throw auditLogError;
    
            setData(prev => ({ ...prev, orgSummary, allPendingRewards, auditLog }));
    
          } else if (profile.user_type === 'organization_admin' || profile.user_type === 'executive_admin') {
            const { data: wallet, error: walletError } = await supabase.from('organization_wallets').select('*').eq('organization_id', profile.organization_id).single();
            if (walletError && walletError.code !== 'PGRST116') throw walletError;
    
            let walletId = wallet?.id;
            if (!wallet) {
              const { data: newWallet, error: newWalletError } = await supabase.rpc('get_or_create_wallet', { org_id: profile.organization_id });
              if (newWalletError) throw newWalletError;
              const { data: fetchedWallet, error: fetchErr } = await supabase.from('organization_wallets').select('*').eq('id', newWallet).single();
              if(fetchErr) throw fetchErr;
              walletId = fetchedWallet.id;
              setData(prev => ({ ...prev, wallet: fetchedWallet }));
            } else {
               setData(prev => ({ ...prev, wallet }));
            }
    
            const { data: transactions, error: transError } = await supabase.from('wallet_transactions').select('*').eq('wallet_id', walletId).order('created_at', { ascending: false });
            if (transError) throw transError;
    
            const { data: resolved, error: resolvedError } = await supabase.from('reports').select('*').eq('organization_id', profile.organization_id).eq('status', 'Resolved').is('reward_paycode', null);
            if (resolvedError) throw resolvedError;
    
            const { data: pending, error: pendingError } = await supabase.from('reports').select('*').eq('organization_id', profile.organization_id).eq('reward_status', 'pending_request');
            if (pendingError) throw pendingError;
    
            const { data: paid, error: paidError } = await supabase.from('reports').select('*').eq('organization_id', profile.organization_id).eq('reward_status', 'paid');
            if (paidError) throw paidError;
    
            const { data: rejected, error: rejectedError } = await supabase.from('reports').select('*').eq('organization_id', profile.organization_id).eq('reward_status', 'rejected');
            if (rejectedError) throw rejectedError;
    
            setData(prev => ({ ...prev, walletTransactions: transactions, resolvedReports: resolved, pendingRewards: pending, paidRewards: paid, rejectedRewards: rejected }));
          }
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
        } finally {
          setLoading(false);
        }
      }, [profile, toast]);
    
      useEffect(() => {
        fetchData();
      }, [fetchData]);
    
      const handleRewardAmountChange = (reportId, amount) => {
        setRewardAmounts(prev => ({ ...prev, [reportId]: amount }));
      };
    
      const handleRequestReward = async (reportId) => {
        const amount = rewardAmounts[reportId];
        if (!amount || amount <= 0) {
          toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid reward amount.' });
          return;
        }
        if (data.wallet.balance < amount) {
          toast({ variant: 'destructive', title: 'Insufficient Funds', description: 'Your wallet balance is too low. Please deposit funds.' });
          return;
        }
    
        setLoading(true);
        try {
          const { error } = await supabase.from('reports').update({ reward_requested_amount: amount, reward_status: 'pending_request' }).eq('id', reportId);
          if (error) throw error;
          
          console.log(`Email notification to Whistleblower Admin: New reward request for report ${reportId}`);
    
          toast({ title: 'Success', description: 'Reward request submitted.' });
          fetchData();
        } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
          setLoading(false);
        }
      };
    
      const handleGeneratePaycode = async (report) => {
        setLoading(true);
        try {
            const { data: paycodeData, error: paycodeError } = await supabase.rpc('generate_paycode');
            if (paycodeError) throw paycodeError;
            const paycode = paycodeData;
    
            const { error: updateError } = await supabase.from('reports').update({ reward_paycode: paycode, reward_status: 'paid' }).eq('id', report.id);
            if (updateError) throw updateError;
    
            const { data: wallet, error: walletError } = await supabase.from('organization_wallets').select('id, balance').eq('organization_id', report.organization_id).single();
            if (walletError) throw walletError;
    
            if (wallet.balance < report.reward_requested_amount) {
                throw new Error("Organization has insufficient funds.");
            }
    
            const newBalance = wallet.balance - report.reward_requested_amount;
            const { error: walletUpdateError } = await supabase.from('organization_wallets').update({ balance: newBalance }).eq('id', wallet.id);
            if (walletUpdateError) throw walletUpdateError;
    
            const { error: transError } = await supabase.from('wallet_transactions').insert({
                wallet_id: wallet.id,
                report_id: report.id,
                amount: report.reward_requested_amount,
                transaction_type: 'debit',
                status: 'completed',
                reference_id: `REWARD-${report.report_id}`
            });
            if (transError) throw transError;
    
            console.log(`Email notification to Org: Paycode generated for report ${report.report_id}`);
    
            toast({ title: 'Paycode Generated', description: `Paycode ${paycode} has been generated and assigned.` });
            fetchData();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
      };
      
      const handleExport = (format) => {
         toast({ title: "🚧 Feature Not Implemented", description: "Export functionality is coming soon!" });
      }
    
      if (loading && !data.wallet && !data.orgSummary.length) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
      }
    
      const renderOrgView = () => (
        <Tabs defaultValue="wallet" className="w-full">
            <TabsList>
                <TabsTrigger value="wallet">Wallet</TabsTrigger>
                <TabsTrigger value="request">Request Reward</TabsTrigger>
                <TabsTrigger value="history">Reward History</TabsTrigger>
            </TabsList>

            <TabsContent value="wallet">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="space-y-1.5">
                            <CardTitle className="flex items-center gap-2"><Wallet /> Your Wallet</CardTitle>
                            <CardDescription>Manage your organization's funds for rewards.</CardDescription>
                        </div>
                        <Button onClick={() => window.open('https://paystack.com/pay/demo-payment', '_blank')}>Deposit Funds</Button>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">₦{data.wallet?.balance?.toLocaleString() || '0.00'}</p>
                        
                        <h3 className="text-lg font-semibold mt-6 mb-2">Transaction History</h3>
                        <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Type</TableHead><TableHead>Reference</TableHead></TableRow></TableHeader>
                            <TableBody>
                            {data.walletTransactions.map(tx => (
                                <TableRow key={tx.id}>
                                <TableCell>{format(new Date(tx.created_at), 'PPP')}</TableCell>
                                <TableCell>₦{tx.amount.toLocaleString()}</TableCell>
                                <TableCell>{tx.transaction_type}</TableCell>
                                <TableCell>{tx.reference_id}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="request">
                <Card>
                    <CardHeader>
                        <CardTitle>Request Rewards for Resolved Reports</CardTitle>
                        <CardDescription>Submit reward requests for reports that have been successfully resolved.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Report ID</TableHead><TableHead>Title</TableHead><TableHead>Date Resolved</TableHead><TableHead>Reward Amount</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                        <TableBody>
                        {data.resolvedReports.map(report => (
                            <TableRow key={report.id}>
                            <TableCell>{report.report_id}</TableCell>
                            <TableCell>{report.title}</TableCell>
                            <TableCell>{format(new Date(report.created_at), 'PPP')}</TableCell>
                            <TableCell><Input type="number" placeholder="e.g., 50000" onChange={e => handleRewardAmountChange(report.id, e.target.value)} /></TableCell>
                            <TableCell><Button onClick={() => handleRequestReward(report.id)} disabled={loading}>Request</Button></TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="history">
                <Card>
                    <CardHeader>
                        <CardTitle>Reward History</CardTitle>
                        <CardDescription>Track the status of all your reward requests.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="pending">
                            <TabsList>
                            <TabsTrigger value="pending">Pending Requests</TabsTrigger>
                            <TabsTrigger value="paid">Paid</TabsTrigger>
                            <TabsTrigger value="rejected">Rejected</TabsTrigger>
                            </TabsList>
                            <TabsContent value="pending">
                            <Table>
                                <TableHeader><TableRow><TableHead>Report ID</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                <TableBody>{data.pendingRewards.map(r => <TableRow key={r.id}><TableCell>{r.report_id}</TableCell><TableCell>₦{r.reward_requested_amount?.toLocaleString()}</TableCell><TableCell>Pending Admin Approval</TableCell></TableRow>)}</TableBody>
                            </Table>
                            </TabsContent>
                            <TabsContent value="paid">
                            <Table>
                                <TableHeader><TableRow><TableHead>Report ID</TableHead><TableHead>Amount</TableHead><TableHead>Paycode</TableHead><TableHead>Date Paid</TableHead></TableRow></TableHeader>
                                <TableBody>{data.paidRewards.map(r => <TableRow key={r.id}><TableCell>{r.report_id}</TableCell><TableCell>₦{r.reward_requested_amount?.toLocaleString()}</TableCell><TableCell>{r.reward_paycode}</TableCell><TableCell>{format(new Date(r.updated_at), 'PPP')}</TableCell></TableRow>)}</TableBody>
                            </Table>
                            </TabsContent>
                            <TabsContent value="rejected">
                            <Table>
                                <TableHeader><TableRow><TableHead>Report ID</TableHead><TableHead>Amount</TableHead><TableHead>Reason</TableHead></TableRow></TableHeader>
                                <TableBody>{data.rejectedRewards.map(r => <TableRow key={r.id}><TableCell>{r.report_id}</TableCell><TableCell>₦{r.reward_requested_amount?.toLocaleString()}</TableCell><TableCell>Rejected by Admin</TableCell></TableRow>)}</TableBody>
                            </Table>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      );
    
      const renderAdminView = () => (
        <Tabs defaultValue="summary" className="w-full">
          <TabsList>
            <TabsTrigger value="summary">Organization Summary</TabsTrigger>
            <TabsTrigger value="requests">Pending Reward Requests</TabsTrigger>
            <TabsTrigger value="audit">Reward Audit Log</TabsTrigger>
          </TabsList>
          <TabsContent value="summary">
            <Card>
              <CardHeader><CardTitle>Organization Summary</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Organization</TableHead><TableHead>Wallet Balance</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.orgSummary.map(org => (
                      <TableRow key={org.id}>
                        <TableCell>{org.name}</TableCell>
                        <TableCell>₦{org.organization_wallets && org.organization_wallets.length > 0 ? org.organization_wallets[0]?.balance?.toLocaleString() : '0.00'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="requests">
            <Card>
              <CardHeader><CardTitle>Pending Reward Requests</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Organization</TableHead><TableHead>Report ID</TableHead><TableHead>Amount</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.allPendingRewards.map(report => (
                      <TableRow key={report.id}>
                        <TableCell>{report.organizations.name}</TableCell>
                        <TableCell>{report.report_id}</TableCell>
                        <TableCell>₦{report.reward_requested_amount?.toLocaleString()}</TableCell>
                        <TableCell><Button onClick={() => handleGeneratePaycode(report)} disabled={loading}>Generate Paycode</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="audit">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                      <CardTitle>Reward Audit Log</CardTitle>
                      <CardDescription>Search and export reward transaction history.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                      <Button variant="outline" onClick={() => handleExport('pdf')}>Export PDF</Button>
                      <Button variant="outline" onClick={() => handleExport('csv')}>Export CSV</Button>
                  </div>
              </CardHeader>
              <CardContent>
                  <div className="mb-4"><Input placeholder="Search logs..." /></div>
                  <Table>
                      <TableHeader><TableRow><TableHead>Organization</TableHead><TableHead>Report ID</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                      <TableBody>
                          {data.auditLog.filter(tx => tx.transaction_type === 'debit').map(tx => (
                              <TableRow key={tx.id}>
                                  <TableCell>{tx.wallet?.organization?.name}</TableCell>
                                  <TableCell>{tx.report?.report_id}</TableCell>
                                  <TableCell>₦{tx.amount.toLocaleString()}</TableCell>
                                  <TableCell>{format(new Date(tx.created_at), 'PPP')}</TableCell>
                                  <TableCell>{tx.status}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      );
    
      return (
        <>
          <Helmet>
            <title>Reward Management - WhistleBlower.ng</title>
          </Helmet>
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl font-bold">Reward Management</h1>
            <p className="text-muted-foreground">
              {profile.user_type === 'super_admin'
                ? 'Oversee and manage reward requests from all organizations.'
                : 'Manage your reward funds and process payments for resolved reports.'}
            </p>
          </div>
          {profile.user_type === 'super_admin' ? renderAdminView() : renderOrgView()}
        </>
      );
    };
    
    export default RewardPage;