import React, { useState, useCallback, useMemo, useEffect } from 'react';
import PageHead from '@/components/PageHead';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { FieldError, FieldSuccess, PageErrorBanner } from '@/components/ui/form-feedback';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Coins, Copy, Check, Eye, EyeOff, Gift, MoreHorizontal, Wallet } from 'lucide-react';
import NavbarLoader from '@/components/admin/NavbarLoader';
import { format } from 'date-fns';
import {
  fetchRewardManagementData,
  generateRewardPaycode,
  initializeRewardDeposit,
  requestOrganizationReward,
  syncRewardPaycodeExpiry,
} from '@/lib/rewardAdminApi';
import { calculateDepositQuote, calculateRewardCharge } from '@/lib/rewardFees';
import { parseFormattedNumber } from '@/lib/utils';
import { useLoadOnce } from '@/hooks/useLoadOnce';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';

function organizationName(report) {
  return report?.organizations?.name || report?.organization_name || 'N/A';
}

function eligibleReportLabel(report) {
  const title = String(report.title || '').trim() || 'Untitled report';
  return `${report.report_id} — ${title}`;
}

function hasPaycode(report) {
  return Boolean(report?.has_paycode || report?.reward_paycode);
}

function statusMeta(report) {
  const paycodeStatus = String(report.reward_paycode_status || '').toUpperCase();
  if (paycodeStatus === 'SUCCESS') {
    return { label: 'paid', className: 'bg-blue-100 text-blue-800' };
  }
  if (paycodeStatus === 'EXPIRED') {
    return { label: 'Expired', className: 'bg-red-100 text-red-800' };
  }
  if (paycodeStatus === 'CANCELLED') {
    return { label: 'cancelled', className: 'bg-red-100 text-red-800' };
  }
  if (hasPaycode(report)) {
    return { label: 'approved', className: 'bg-green-100 text-green-800' };
  }
  if (report.reward_status === 'pending_request') {
    return { label: 'pending', className: 'bg-yellow-100 text-yellow-800' };
  }
  if (report.reward_status === 'rejected') {
    return { label: 'rejected', className: 'bg-red-100 text-red-800' };
  }
  return { label: report.reward_status || 'n/a', className: 'bg-muted text-muted-foreground' };
}

function organizationStatusBadge(status) {
  const value = String(status || 'n/a');
  const className =
    value === 'active'
      ? 'bg-green-100 text-green-800'
      : value === 'suspended'
        ? 'bg-red-100 text-red-800'
        : 'bg-yellow-100 text-yellow-800';
  return (
    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${className}`}>
      {value.replace(/_/g, ' ')}
    </span>
  );
}

function formatNaira(value) {
  return `₦${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
function StatusBadge({ report }) {
  const status = statusMeta(report);
  const isExpired =
    status.label !== 'Expired' &&
    report.reward_paycode_expires_at &&
    new Date(report.reward_paycode_expires_at) < new Date() &&
    String(report.reward_paycode_status || '').toUpperCase() !== 'SUCCESS';

  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${status.className}`}>
        {status.label}
      </span>
      {isExpired ? (
        <span className="inline-flex rounded-full bg-red-100 px-2 text-xs font-semibold leading-5 text-red-800">
          Expired
        </span>
      ) : null}
    </span>
  );
}

const RewardPage = () => {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.user_type === 'super_admin';
  const { copy, isCopied, copyError } = useCopyFeedback();

  const [fetchError, setFetchError] = useState('');
  const [actionFeedback, setActionFeedback] = useState({ error: '', success: '' });
  const [loading, setLoading] = useState(true);
  const [pendingActions, setPendingActions] = useState(() => new Set());

  const [wallet, setWallet] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [eligibleReports, setEligibleReports] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositFeedback, setDepositFeedback] = useState({ error: '', success: '' });

  const [visiblePaycodes, setVisiblePaycodes] = useState({});
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [formData, setFormData] = useState({ report_id: '', amount: '' });
  const [formFeedback, setFormFeedback] = useState({ error: '', success: '' });
  const rewardQuote = useMemo(() => {
    try {
      return formData.amount ? calculateRewardCharge(formData.amount) : null;
    } catch {
      return null;
    }
  }, [formData.amount]);
  const depositQuote = useMemo(() => {
    try {
      return depositAmount ? calculateDepositQuote(depositAmount) : null;
    } catch {
      return null;
    }
  }, [depositAmount]);

  const isPending = useCallback(
    (key) => pendingActions.has(key),
    [pendingActions],
  );

  const withPendingAction = useCallback(async (key, action) => {
    setPendingActions((prev) => new Set(prev).add(key));
    try {
      await action();
    } finally {
      setPendingActions((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, []);

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    if (!profile?.id) return;

    if (!silent) setLoading(true);
    setFetchError('');
    try {
      if (isSuperAdmin) {
        syncRewardPaycodeExpiry();
        const rewardData = await fetchRewardManagementData();
        setRewards(rewardData.rewards || []);
        setEligibleReports(rewardData.eligibleReports || []);

        const { data: orgRows, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, status, organization_wallets(balance)')
          .order('name', { ascending: true });
        if (orgError) throw orgError;
        setOrganizations(orgRows || []);
        return;
      }

      const { data: existingWallet, error: walletError } = await supabase
        .from('organization_wallets')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .maybeSingle();
      if (walletError) throw walletError;

      let currentWallet = existingWallet;
      if (!currentWallet) {
        const { data: newWalletId, error: newWalletError } = await supabase.rpc(
          'get_or_create_wallet',
          { org_id: profile.organization_id },
        );
        if (newWalletError) throw newWalletError;
        const { data: fetchedWallet, error: fetchErr } = await supabase
          .from('organization_wallets')
          .select('*')
          .eq('id', newWalletId)
          .single();
        if (fetchErr) throw fetchErr;
        currentWallet = fetchedWallet;
      }
      setWallet(currentWallet);

      const { data: transactions, error: transError } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', currentWallet.id)
        .order('created_at', { ascending: false });
      if (transError) throw transError;
      setWalletTransactions(transactions || []);

      const rewardData = await fetchRewardManagementData();
      setRewards(rewardData.rewards || []);
      setEligibleReports(rewardData.eligibleReports || []);
    } catch (error) {
      setFetchError(error.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [profile?.id, profile?.organization_id, isSuperAdmin]);

  useLoadOnce(Boolean(profile?.id), fetchData);
  const refreshRewardData = useCallback(
    () => fetchData({ silent: true }),
    [fetchData],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const params = new URLSearchParams(window.location.search);
    const deposit = params.get('deposit');
    if (!deposit) return undefined;

    if (deposit === 'success') {
      setActionFeedback({
        error: '',
        success: 'Payment submitted. Your wallet will update once Monnify confirms the deposit.',
      });
      refreshRewardData();
    } else if (deposit === 'failed') {
      setActionFeedback({ error: 'Deposit was not completed.', success: '' });
    }

    window.history.replaceState({}, '', '/admin/reward');
    return undefined;
  }, [refreshRewardData]);

  const sortedRewards = useMemo(() => {
    const rank = (report) => {
      if (report.reward_status === 'pending_request' && !hasPaycode(report)) return 0;
      if (hasPaycode(report) && String(report.reward_paycode_status || '').toUpperCase() === 'PENDING') return 1;
      return 2;
    };
    return [...rewards].sort((a, b) => rank(a) - rank(b));
  }, [rewards]);

  const openGenerateDialog = (report = null) => {
    setFormFeedback({ error: '', success: '' });
    setFormData({
      report_id: report?.id || '',
      amount: report?.reward_requested_amount || '',
    });
    setIsGenerateOpen(true);
  };

  const openRequestDialog = () => {
    setFormFeedback({ error: '', success: '' });
    setFormData({ report_id: '', amount: '' });
    setIsRequestOpen(true);
  };

  const handleEligibleSelect = (reportId) => {
    const report = eligibleReports.find((row) => row.id === reportId);
    setFormData({
      report_id: reportId,
      amount: report?.reward_requested_amount || formData.amount,
    });
  };

  const handleGeneratePaycode = (e) => {
    e.preventDefault();
    setActionFeedback({ error: '', success: '' });
    setFormFeedback({ error: '', success: '' });

    const report =
      eligibleReports.find((row) => row.id === formData.report_id) ||
      rewards.find((row) => row.id === formData.report_id);
    if (!report) {
      setFormFeedback({ error: 'Please select a resolved report.', success: '' });
      return;
    }

    const needsAmount =
      report.reward_status !== 'pending_request' || !report.reward_requested_amount;
    const amount = needsAmount ? parseFormattedNumber(formData.amount) : Number(report.reward_requested_amount);
    if (needsAmount && (!Number.isFinite(amount) || amount <= 0)) {
      setFormFeedback({ error: 'Please enter a valid reward amount.', success: '' });
      return;
    }

    withPendingAction(`generate:${report.id}`, async () => {
      try {
        await generateRewardPaycode(
          report.id,
          needsAmount ? amount : undefined,
        );
        setFormFeedback({ error: '', success: `Paycode generated for ₦${Number(amount).toLocaleString()}` });
        setActionFeedback({
          error: '',
          success: `Monnify paycode has been generated and assigned.`,
        });
        setIsGenerateOpen(false);
        await refreshRewardData();
      } catch (error) {
        setFormFeedback({ error: error.message, success: '' });
      }
    });
  };

  const handleRequestReward = (e) => {
    e.preventDefault();
    setFormFeedback({ error: '', success: '' });
    const amount = parseFormattedNumber(formData.amount);
    if (!formData.report_id) {
      setFormFeedback({ error: 'Please select a resolved report.', success: '' });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFormFeedback({ error: 'Please enter a valid reward amount.', success: '' });
      return;
    }
    const charge = calculateRewardCharge(amount);
    if (Number(wallet?.balance || 0) < charge.totalDebit) {
      setFormFeedback({
        error: `Your wallet must cover the reward and 10% service charge (${formatNaira(charge.totalDebit)} total).`,
        success: '',
      });
      return;
    }

    withPendingAction(`request:${formData.report_id}`, async () => {
      try {
        await requestOrganizationReward(formData.report_id, amount);
        setFormFeedback({ error: '', success: 'Reward request submitted.' });
        setActionFeedback({ error: '', success: 'Reward request submitted.' });
        setIsRequestOpen(false);
        await refreshRewardData();
      } catch (error) {
        setFormFeedback({ error: error.message, success: '' });
      }
    });
  };

  const handleRejectReward = () => {
    if (!selectedReward) return;
    setActionFeedback({ error: '', success: '' });
    withPendingAction(`reject:${selectedReward.id}`, async () => {
      try {
        const { error } = await supabase
          .from('reports')
          .update({ reward_status: 'rejected' })
          .eq('id', selectedReward.id)
          .eq('reward_status', 'pending_request');
        if (error) throw error;
        setActionFeedback({
          error: '',
          success: `Reward request for ${selectedReward.report_id} was rejected.`,
        });
        setIsRejectOpen(false);
        setSelectedReward(null);
        await refreshRewardData();
      } catch (error) {
        setActionFeedback({ error: error.message, success: '' });
      }
    });
  };

  const handleDepositFunds = (e) => {
    e.preventDefault();
    setDepositFeedback({ error: '', success: '' });
    const amount = parseFormattedNumber(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setDepositFeedback({ error: 'Please enter a valid deposit amount.', success: '' });
      return;
    }

    withPendingAction('deposit', async () => {
      try {
        const result = await initializeRewardDeposit(amount);
        if (!result?.checkoutUrl) {
          throw new Error('Monnify did not return a checkout URL.');
        }
        window.location.assign(result.checkoutUrl);
      } catch (error) {
        setDepositFeedback({ error: error.message, success: '' });
      }
    });
  };

  const togglePaycodeVisibility = (rewardId) => {
    setVisiblePaycodes((prev) => ({ ...prev, [rewardId]: !prev[rewardId] }));
  };

  if (loading && rewards.length === 0 && !wallet) {
    return (
      <>
        <PageHead title="Loading Reward Management — WhistleBlower.ng" />
        <NavbarLoader />
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Reward Management</h1>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead title="Reward Management — WhistleBlower.ng" />
      {loading && <NavbarLoader />}
      <div className="space-y-6">
        <PageErrorBanner error={fetchError} title="Could not load reward data" />
        <FieldError message={actionFeedback.error} />
        <FieldSuccess message={actionFeedback.success} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reward Management</h1>
            <p className="text-muted-foreground">
              {isSuperAdmin
                ? 'Generate Paycode rewards from organization deposits, and track each company wallet.'
                : 'Deposit funds into WhistleBlower’s Monnify account, then request rewards for resolved reports.'}
            </p>
          </div>
          <div className="flex gap-2">
            {isSuperAdmin ? (
              <Button onClick={() => openGenerateDialog()}>
                <Coins className="mr-2 h-4 w-4" /> Generate Paycode
              </Button>
            ) : (
              <Button onClick={openRequestDialog}>
                <Gift className="mr-2 h-4 w-4" /> Request Reward
              </Button>
            )}
          </div>
        </div>

        {!isSuperAdmin && (
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" /> Your Wallet
                </CardTitle>
                <CardDescription>Funds available for reward requests.</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setDepositAmount('');
                  setDepositFeedback({ error: '', success: '' });
                  setIsDepositOpen(true);
                }}
              >
                Deposit Funds
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{formatNaira(wallet?.balance)}</p>
            </CardContent>
          </Card>
        )}

        {(() => {
    const rewardsTable = (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report ID</TableHead>
                    {isSuperAdmin && <TableHead>Organization</TableHead>}
                    <TableHead>Reward</TableHead>
                    <TableHead>Service Fee</TableHead>
                    <TableHead>Total Debit</TableHead>
                    <TableHead>Status</TableHead>
                    {isSuperAdmin && <TableHead>Paycode</TableHead>}
                    <TableHead>Expires</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 9 : 7} className="text-center text-muted-foreground">
                        Loading rewards…
                      </TableCell>
                    </TableRow>
                  ) : sortedRewards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isSuperAdmin ? 9 : 7} className="text-center text-muted-foreground">
                        No rewards yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedRewards.map((report) => {
                      const isVisible = visiblePaycodes[report.id];

                      return (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">{report.report_id}</TableCell>
                          {isSuperAdmin && (
                            <TableCell>{organizationName(report)}</TableCell>
                          )}
                          <TableCell>
                            {report.reward_requested_amount
                              ? formatNaira(report.reward_requested_amount)
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {report.reward_service_fee_amount != null
                              ? formatNaira(report.reward_service_fee_amount)
                              : report.reward_requested_amount
                                ? formatNaira(calculateRewardCharge(report.reward_requested_amount).serviceFee)
                                : 'N/A'}
                          </TableCell>
                          <TableCell>
                            {report.reward_total_debit != null
                              ? formatNaira(report.reward_total_debit)
                              : report.reward_requested_amount
                                ? formatNaira(calculateRewardCharge(report.reward_requested_amount).totalDebit)
                                : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge report={report} />
                          </TableCell>
                          {isSuperAdmin && (
                            <TableCell>
                              {report.reward_paycode ? (
                                <div className="flex items-center gap-2">
                                  <code className="rounded bg-muted px-2 py-1 text-sm">
                                    {isVisible ? report.reward_paycode : '••••••••'}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => togglePaycodeVisibility(report.id)}
                                  >
                                    {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                  {isVisible && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => copy(report.reward_paycode, report.id)}
                                    >
                                      {isCopied(report.id) ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </TableCell>
                          )}
                          <TableCell>
                            {report.reward_paycode_expires_at
                              ? format(new Date(report.reward_paycode_expires_at), 'PP')
                              : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {hasPaycode(report) && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedReward(report);
                                      setIsDetailsOpen(true);
                                    }}
                                  >
                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                  </DropdownMenuItem>
                                )}
                                {isSuperAdmin && !hasPaycode(report) && (
                                  <DropdownMenuItem onClick={() => openGenerateDialog(report)}>
                                    <Coins className="mr-2 h-4 w-4" /> Generate Paycode
                                  </DropdownMenuItem>
                                )}
                                {isSuperAdmin && report.reward_status === 'pending_request' && !hasPaycode(report) && (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                      setSelectedReward(report);
                                      setIsRejectOpen(true);
                                    }}
                                  >
                                    Reject Request
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            {copyError ? <FieldError message={copyError} className="mt-3" /> : null}
          </CardContent>
        </Card>
    );

    return isSuperAdmin ? (
      <Tabs defaultValue="rewards" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
        </TabsList>
        <TabsContent value="rewards">{rewardsTable}</TabsContent>
        <TabsContent value="organizations">
          <Card>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Wallet Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Loading organizations…
                        </TableCell>
                      </TableRow>
                    ) : organizations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No organizations found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      organizations.map((org) => {
                        const walletRow = Array.isArray(org.organization_wallets)
                          ? org.organization_wallets[0]
                          : org.organization_wallets;
                        const balance = walletRow?.balance ?? 0;
                        return (
                          <TableRow key={org.id}>
                            <TableCell className="font-medium">{org.name}</TableCell>
                            <TableCell>{organizationStatusBadge(org.status)}</TableCell>
                            <TableCell>{formatNaira(balance)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    ) : (
      rewardsTable
    );
  })()}

        {!isSuperAdmin && walletTransactions.length > 0 && (
          <Card>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walletTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{format(new Date(tx.created_at), 'PPP')}</TableCell>
                        <TableCell>{formatNaira(tx.amount)}</TableCell>
                        <TableCell className="capitalize">
                          {(tx.transaction_subtype || tx.transaction_type).replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell>{tx.reference_id}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent aria-describedby="paycode-dialog-description">
          <DialogHeader>
            <DialogTitle>Generate Paycode Reward</DialogTitle>
          </DialogHeader>
          <div id="paycode-dialog-description" className="sr-only">
            Generate a Monnify Paycode for a resolved report by selecting the report and entering the reward amount.
          </div>
          <form onSubmit={handleGeneratePaycode} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report_id">Resolved Report</Label>
              <Select
                value={formData.report_id}
                onValueChange={handleEligibleSelect}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a resolved report" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleReports.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No resolved reports are eligible. Only reports where the reporter chose to be eligible for a reward can receive a paycode.
                    </div>
                  ) : (
                    eligibleReports.map((report) => (
                      <SelectItem key={report.id} value={report.id}>
                        {eligibleReportLabel(report)}
                        {isSuperAdmin ? ` — ${organizationName(report)}` : ''}
                        {report.reward_status === 'pending_request' ? ' (requested)' : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Reward Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g. 50,000"
                required
              />
            </div>
            {rewardQuote ? (
              <div className="space-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Reporter receives</span>
                  <span>{formatNaira(rewardQuote.rewardAmount)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Platform service charge (10%)</span>
                  <span>{formatNaira(rewardQuote.serviceFee)}</span>
                </div>
                <div className="flex justify-between gap-4 border-t pt-2 font-semibold">
                  <span>Total wallet debit</span>
                  <span>{formatNaira(rewardQuote.totalDebit)}</span>
                </div>
              </div>
            ) : null}
            <FieldError message={formFeedback.error} />
            <FieldSuccess message={formFeedback.success} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsGenerateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isPending(`generate:${formData.report_id}`)}>
                Generate Paycode
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
        <DialogContent aria-describedby="request-dialog-description">
          <DialogHeader>
            <DialogTitle>Request Reward</DialogTitle>
          </DialogHeader>
          <div id="request-dialog-description" className="sr-only">
            Submit a reward request for a resolved report. WhistleBlower.ng will approve and issue a Paycode.
          </div>
          <form onSubmit={handleRequestReward} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="request_report_id">Resolved Report</Label>
              <Select
                value={formData.report_id}
                onValueChange={(value) => setFormData({ ...formData, report_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a resolved report" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleReports.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No resolved reports are eligible. Only reports where the reporter chose to be eligible for a reward can be requested.
                    </div>
                  ) : (
                    eligibleReports.map((report) => (
                      <SelectItem key={report.id} value={report.id}>
                        {eligibleReportLabel(report)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="request_amount">Reward Amount (₦)</Label>
              <Input
                id="request_amount"
                type="number"
                min="1"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="e.g. 50,000"
                required
              />
            </div>
            {rewardQuote ? (
              <div className="space-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Reporter receives</span>
                  <span>{formatNaira(rewardQuote.rewardAmount)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Platform service charge (10%)</span>
                  <span>{formatNaira(rewardQuote.serviceFee)}</span>
                </div>
                <div className="flex justify-between gap-4 border-t pt-2 font-semibold">
                  <span>Total wallet debit</span>
                  <span>{formatNaira(rewardQuote.totalDebit)}</span>
                </div>
              </div>
            ) : null}
            <FieldError message={formFeedback.error} />
            <FieldSuccess message={formFeedback.success} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsRequestOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isPending(`request:${formData.report_id}`)}>
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent aria-describedby="deposit-dialog-description">
          <DialogHeader>
            <DialogTitle>Deposit Funds</DialogTitle>
          </DialogHeader>
          <div id="deposit-dialog-description" className="sr-only">
            Deposit money into WhistleBlower's Monnify account. The amount will be credited to your organization wallet after payment is confirmed.
          </div>
          <form onSubmit={handleDepositFunds} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="deposit_amount">Amount (₦)</Label>
              <Input
                id="deposit_amount"
                type="number"
                min="1"
                step="0.01"
                value={depositAmount}
                onChange={(e) => {
                  setDepositAmount(e.target.value);
                  setDepositFeedback({ error: '', success: '' });
                }}
                placeholder="e.g. 50,000"
                required
              />
            </div>
            {depositQuote ? (
              <div className="space-y-2 rounded-lg border bg-muted/40 p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Wallet credit</span>
                  <span className="font-medium">{formatNaira(depositQuote.walletCredit)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Monnify processing charge</span>
                  <span className="font-medium">{formatNaira(depositQuote.processingFee)}</span>
                </div>
                <div className="flex justify-between gap-4 border-t pt-2">
                  <span className="font-semibold">Total payable</span>
                  <span className="font-semibold">{formatNaira(depositQuote.totalPayable)}</span>
                </div>
              </div>
            ) : null}
            <FieldError message={depositFeedback.error} />
            <FieldSuccess message={depositFeedback.success} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDepositOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isPending('deposit')} disabled={!depositQuote}>
                {depositQuote
                  ? `Pay ${formatNaira(depositQuote.totalPayable)} with Monnify`
                  : 'Continue to Monnify'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent aria-describedby="paycode-details-description">
          <DialogHeader>
            <DialogTitle>{isSuperAdmin ? 'Paycode Details' : 'Reward Details'}</DialogTitle>
          </DialogHeader>
          <div id="paycode-details-description" className="sr-only">
            View reward amount, service fee, status, and expiration information.
          </div>
          {selectedReward && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Report ID</Label>
                  <p className="font-mono text-sm">{selectedReward.report_id}</p>
                </div>
                <div>
                  <Label>Reporter receives</Label>
                  <p className="font-medium">
                    {formatNaira(selectedReward.reward_requested_amount)}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Service charge (10%)</Label>
                  <p className="font-medium">
                    {formatNaira(
                      selectedReward.reward_service_fee_amount ??
                      calculateRewardCharge(selectedReward.reward_requested_amount).serviceFee,
                    )}
                  </p>
                </div>
                <div>
                  <Label>Total wallet debit</Label>
                  <p className="font-medium">
                    {formatNaira(
                      selectedReward.reward_total_debit ??
                      calculateRewardCharge(selectedReward.reward_requested_amount).totalDebit,
                    )}
                  </p>
                </div>
              </div>
              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label>Paycode</Label>
                  <div className="flex items-center gap-2">
                    <Input value={selectedReward.reward_paycode || ''} readOnly className="font-mono" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copy(selectedReward.reward_paycode, `details-${selectedReward.id}`)}
                    >
                      {isCopied(`details-${selectedReward.id}`) ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <FieldError message={copyError} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <p className="text-sm"><StatusBadge report={selectedReward} /></p>
                </div>
                <div>
                  <Label>Expires</Label>
                  <p className="text-sm">
                    {selectedReward.reward_paycode_expires_at
                      ? format(new Date(selectedReward.reward_paycode_expires_at), 'PPP p')
                      : 'N/A'}
                  </p>
                </div>
              </div>
              {isSuperAdmin && (
                <div>
                  <Label>Organization</Label>
                  <p className="text-sm text-muted-foreground">{organizationName(selectedReward)}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this reward request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the request for {selectedReward?.report_id} as rejected. You can still generate a paycode later from a resolved report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectReward}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isPending(`reject:${selectedReward?.id}`)}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default RewardPage;
