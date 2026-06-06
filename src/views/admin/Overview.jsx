import { useRouter } from 'next/navigation';
import Link from 'next/link';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import PageHead from '@/components/PageHead';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Search,
  ArrowRight,
  PlusCircle,
  MessageSquare,
  Award,
  TrendingUp,
  Sparkles,
  Activity,
} from 'lucide-react';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useAdminData } from '@/contexts/AdminDataContext';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import PageContentWrapper from '@/components/admin/PageContentWrapper';
import PageHeader from '@/components/admin/PageHeader';
import { supabase } from '@/lib/customSupabaseClient';

const COLORS = ['#ff5100', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899'];
const TERMINAL_STATUSES = new Set(['Resolved', 'resolved', 'Closed', 'closed', 'Rejected', 'rejected', 'refunded']);
const ACTIVE_STATUSES = new Set([
  'Under Review',
  'under_review',
  'pending_review',
  'Assigned',
  'Under Investigation',
  'Investigation',
  'approved',
  'published',
  'report_received',
]);

const StatCard = ({ title, value, subtitle, icon, link, tone = 'default' }) => {
  const router = useRouter();
  const toneStyles = {
    default: 'from-primary/10 via-primary/5 to-transparent',
    warning: 'from-amber-500/15 via-amber-500/5 to-transparent',
    success: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    danger: 'from-destructive/15 via-destructive/5 to-transparent',
  };

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden border-border/60 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
      onClick={() => router.push(link)}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-90', toneStyles[tone])} />
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent className="relative space-y-1">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
};

const Overview = () => {
  const [stats, setStats] = useState({
    total: 0,
    underReview: 0,
    urgent: 0,
    resolved: 0,
    reports: 0,
    bounties: 0,
    feedback: 0,
  });
  const [allItems, setAllItems] = useState([]);
  const [categoryMix, setCategoryMix] = useState([]);
  const [reportsOverTime, setReportsOverTime] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [highPriorityReports, setHighPriorityReports] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const hasInitialData = useRef(false);
  const { profile, loading: profileLoading } = useAuth();
  const { fetchReports, fetchBounties } = useAdminData();
  const profileId = profile?.id;
  const profileUserType = profile?.user_type;
  const profileOrganizationId = profile?.organization_id;

  const fetchFeedback = useCallback(async () => {
    if (!profileId) return [];

    let query = supabase
      .from('reports')
      .select('id, report_id, title, status, category, urgency, created_at, is_feedback')
      .eq('is_trashed', false)
      .eq('is_feedback', true);

    if (profileUserType !== 'super_admin') {
      query = query.eq('organization_id', profileOrganizationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }, [profileId, profileUserType, profileOrganizationId]);

  const processReportData = useCallback((reportData, bountyData, feedbackData) => {
    const normalizedReports = (reportData || []).map((item) => ({ ...item, sourceType: 'report' }));
    const normalizedBounties = (bountyData || []).map((item) => ({
      ...item,
      sourceType: item.item_type === 'bounty' ? 'bounty' : 'report',
      category: item.item_type === 'bounty' ? 'Bounty' : item.category || 'Bounty Report',
    }));
    const normalizedFeedback = (feedbackData || []).map((item) => ({
      ...item,
      sourceType: 'feedback',
      category: item.category || 'Feedback',
    }));

    const combined = [...normalizedReports, ...normalizedBounties, ...normalizedFeedback].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    setAllItems(combined);

    const total = combined.length;
    const underReview = combined.filter((r) => ACTIVE_STATUSES.has(r.status)).length;
    const urgent = combined.filter(
      (r) =>
        r.urgency === 'Critical' ||
        r.urgency === 'High' ||
        (r.sourceType === 'bounty' && ['pending_review', 'report_received'].includes(r.status))
    ).length;
    const resolved = combined.filter((r) => TERMINAL_STATUSES.has(r.status)).length;

    setStats({
      total,
      underReview,
      urgent,
      resolved,
      reports: normalizedReports.length,
      bounties: normalizedBounties.length,
      feedback: normalizedFeedback.length,
    });

    const categoryCounts = combined.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = { name: category, reports: 0, bounties: 0, feedback: 0, total: 0 };
      }
      if (item.sourceType === 'feedback') {
        acc[category].feedback += 1;
      } else if (item.sourceType === 'bounty') {
        acc[category].bounties += 1;
      } else {
        acc[category].reports += 1;
      }
      acc[category].total += 1;
      return acc;
    }, {});
    setCategoryMix(
      Object.values(categoryCounts)
        .sort((a, b) => b.total - a.total)
        .slice(0, 8)
    );

    const statusCounts = combined.reduce((acc, item) => {
      const status = item.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    setStatusBreakdown(
      Object.entries(statusCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
    );

    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentReports = combined.filter((r) => new Date(r.created_at) > thirtyDaysAgo);
    const timeCounts = recentReports.reduce((acc, report) => {
      const date = format(new Date(report.created_at), 'MMM dd');
      if (!acc[date]) {
        acc[date] = { report: 0, bounty: 0, feedback: 0 };
      }
      if (report.sourceType === 'feedback') {
        acc[date].feedback += 1;
      } else if (report.sourceType === 'bounty') {
        acc[date].bounty += 1;
      } else {
        acc[date].report += 1;
      }
      return acc;
    }, {});

    const overTimeData = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      const formattedDate = format(date, 'MMM dd');
      return {
        name: formattedDate,
        reports: timeCounts[formattedDate]?.report || 0,
        bounties: timeCounts[formattedDate]?.bounty || 0,
        feedback: timeCounts[formattedDate]?.feedback || 0,
      };
    }).reverse();
    setReportsOverTime(overTimeData);

    setRecentActivity(combined.slice(0, 7));
    setHighPriorityReports(
      combined
        .filter((r) => (r.urgency === 'Critical' || r.urgency === 'High') && !TERMINAL_STATUSES.has(r.status))
        .slice(0, 6)
    );
  }, []);

  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    if (!profileId || profileLoading) return;
    if (hasInitialData.current && !forceRefresh) return;

    const showLoading = !hasInitialData.current;
    if (showLoading) setInitialLoading(true);

    try {
      const [reportData, bountyData, feedbackData] = await Promise.all([
        fetchReports(),
        fetchBounties(),
        fetchFeedback(),
      ]);
      processReportData(reportData, bountyData, feedbackData);
      hasInitialData.current = true;
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      if (showLoading) setInitialLoading(false);
    }
  }, [profileId, profileLoading, fetchReports, fetchBounties, fetchFeedback, processReportData]);

  useEffect(() => {
    if (!profileLoading && profileId && !hasInitialData.current) {
      loadDashboardData(true);
    }
  }, [profileLoading, profileId, loadDashboardData]);

  const planName = profile?.plans?.name;
  const canSeeAdvancedFeatures = profile && (profile.user_type === 'super_admin' || ['Executive', 'ExpressCreo'].includes(planName));
  const isLoading = initialLoading;
  const typeDistributionData = [
    { name: 'Reports', value: stats.reports },
    { name: 'Bounties', value: stats.bounties },
    { name: 'Feedback', value: stats.feedback },
  ].filter((item) => item.value > 0);

  const getActivityRoute = (item) => {
    if (item.sourceType === 'bounty' && item.item_type === 'bounty') return `/admin/bounties/${item.id}`;
    if (item.sourceType === 'bounty' && item.item_type === 'report' && item.bounty_id) {
      return `/admin/bounties/${item.bounty_id}?reportId=${item.id}`;
    }
    if (item.sourceType === 'feedback') return `/admin/reports/${item.id}`;
    return `/admin/reports/${item.id}`;
  };

  const getItemPill = (item) => {
    if (item.sourceType === 'feedback') {
      return <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-600">Feedback</span>;
    }
    if (item.sourceType === 'bounty') {
      return <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-xs font-medium text-fuchsia-600">Bounty</span>;
    }
    return <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">Report</span>;
  };

  return (
    <>
      <PageHead title="Dashboard Overview — WhistleBlower.ng" />
      <PageContentWrapper loading={isLoading} loadingText="Loading dashboard data...">
        <div className="space-y-8">
          <PageHeader
            title={`Welcome back, ${profile?.name || 'Admin'}!`}
            description="Complete intelligence across reports, bounties, and customer feedback."
          />

          <Card className="overflow-hidden border-border/60">
            <CardContent className="relative p-6 md:p-8">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-fuchsia-500/10" />
              <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5" />
                    Intelligence Center
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    {stats.total} total submissions are in your pipeline
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Live snapshot from reports, bounty activity, and customer feedback.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Reports', value: stats.reports, icon: FileText },
                    { label: 'Bounties', value: stats.bounties, icon: Award },
                    { label: 'Feedback', value: stats.feedback, icon: MessageSquare },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-lg border border-border/70 bg-background/70 px-4 py-3">
                      <metric.icon className="mx-auto mb-2 h-4 w-4 text-primary" />
                      <div className="text-xl font-semibold">{metric.value}</div>
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Intake"
              value={stats.total}
              subtitle="All reports, bounties and feedback"
              icon={<Activity className="h-4 w-4" />}
              link="/admin/reports"
            />
            <StatCard
              title="Under Review"
              value={stats.underReview}
              subtitle="Active in workflow right now"
              icon={<Search className="h-4 w-4" />}
              link="/admin/reports?status=Under+Review"
            />
            <StatCard
              title="Urgent Items"
              value={stats.urgent}
              subtitle="Critical or high-priority attention"
              icon={<AlertTriangle className="h-4 w-4" />}
              link="/admin/reports?urgency=High"
              tone="danger"
            />
            <StatCard
              title="Resolved"
              value={stats.resolved}
              subtitle="Closed or completed outcomes"
              icon={<CheckCircle className="h-4 w-4" />}
              link="/admin/reports?status=Resolved"
              tone="success"
            />
          </div>

          <div className="grid gap-4 grid-cols-1 xl:grid-cols-12">
            <Card className="xl:col-span-8 border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Submission Flow (Last 30 Days)
                </CardTitle>
                <CardDescription>Daily intake split by reports, bounties, and feedback.</CardDescription>
              </CardHeader>
              <CardContent className="pl-0 pr-4">
                <ResponsiveContainer width="100%" height={320}>
                  <ReBarChart data={reportsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="reports" stackId="a" fill="#ff5100" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="bounties" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="feedback" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="xl:col-span-4 border-border/60">
              <CardHeader>
                <CardTitle>Source Distribution</CardTitle>
                <CardDescription>Where incoming items are coming from.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RePieChart>
                    <Pie
                      data={typeDistributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {typeDistributionData.map((entry, index) => (
                        <Cell key={`type-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconSize={10} />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 grid-cols-1 xl:grid-cols-12">
            <Card className="xl:col-span-5 border-border/60">
              <CardHeader>
                <CardTitle>Category Mix</CardTitle>
                <CardDescription>
                  Top categories ranked by volume, split by source type.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryMix.length > 0 ? (
                  <>
                    <div className="mb-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {[
                        { key: 'reports', label: 'Reports', color: '#ff5100' },
                        { key: 'bounties', label: 'Bounties', color: '#8b5cf6' },
                        { key: 'feedback', label: 'Feedback', color: '#3b82f6' },
                      ].map((item) => (
                        <span key={item.key} className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.label}
                        </span>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={Math.max(240, categoryMix.length * 36)}>
                      <ReBarChart
                        data={categoryMix}
                        layout="vertical"
                        margin={{ top: 4, right: 12, left: 4, bottom: 4 }}
                        barCategoryGap="20%"
                      >
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.12} horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={108}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) => (value.length > 14 ? `${value.slice(0, 14)}…` : value)}
                        />
                        <Tooltip
                          cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}
                          content={({ active, payload, label }) => {
                            if (!active || !payload?.length) return null;
                            const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0);
                            return (
                              <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                                <p className="mb-2 font-medium text-foreground">{label}</p>
                                {payload.map((entry) => (
                                  <div key={entry.dataKey} className="flex items-center justify-between gap-4">
                                    <span className="capitalize text-muted-foreground">{entry.name}</span>
                                    <span className="font-medium">{entry.value}</span>
                                  </div>
                                ))}
                                <div className="mt-2 flex items-center justify-between border-t border-border pt-2 font-medium">
                                  <span>Total</span>
                                  <span>{total}</span>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="reports" name="Reports" stackId="mix" fill="#ff5100" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="bounties" name="Bounties" stackId="mix" fill="#8b5cf6" />
                        <Bar dataKey="feedback" name="Feedback" stackId="mix" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </ReBarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
                      {categoryMix.slice(0, 4).map((category, index) => {
                        const share = stats.total ? Math.round((category.total / stats.total) * 100) : 0;
                        return (
                          <div key={category.name} className="flex items-center gap-3 text-xs">
                            <span className="w-4 font-semibold text-muted-foreground">{index + 1}</span>
                            <span className="min-w-0 flex-1 truncate font-medium">{category.name}</span>
                            <span className="text-muted-foreground">{category.total}</span>
                            <span className="w-10 text-right font-medium">{share}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="py-12 text-center text-sm text-muted-foreground">No category data yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-7 border-border/60">
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
                <CardDescription>Most frequent statuses currently in the system.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {statusBreakdown.length > 0 ? (
                  statusBreakdown.map((statusItem) => {
                    const ratio = stats.total ? Math.round((statusItem.count / stats.total) * 100) : 0;
                    return (
                      <div key={statusItem.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{statusItem.name}</span>
                          <span className="text-muted-foreground">
                            {statusItem.count} ({ratio}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${ratio}%` }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="py-8 text-sm text-muted-foreground">No status data yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {canSeeAdvancedFeatures && (
            <div className="grid gap-4 grid-cols-1 xl:grid-cols-12">
              <Card className="xl:col-span-8 border-border/60">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest events across reports, bounties, and feedback.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.map((item) => (
                      <Link key={`${item.sourceType}-${item.id}`} href={getActivityRoute(item)}>
                        <div className="group flex items-start gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/40">
                          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                            {item.sourceType === 'feedback' ? (
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                            ) : item.sourceType === 'bounty' ? (
                              <Award className="h-4 w-4 text-fuchsia-600" />
                            ) : (
                              <FileText className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              {getItemPill(item)}
                              <p className="truncate text-sm font-medium">{item.title || 'Untitled Item'}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {item.category || 'Uncategorized'} - {item.status || 'Unknown status'}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="xl:col-span-4 border-border/60">
                <CardHeader>
                  <CardTitle>Attention Queue</CardTitle>
                  <CardDescription>High-priority items pending resolution.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {highPriorityReports.length > 0 ? (
                    highPriorityReports.map((item) => (
                      <div key={`${item.sourceType}-${item.id}`} className="rounded-lg border border-border/70 p-3">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{item.title || 'Untitled Item'}</p>
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-medium',
                              item.urgency === 'Critical'
                                ? 'bg-destructive/20 text-destructive'
                                : 'bg-amber-500/20 text-amber-700'
                            )}
                          >
                            {item.urgency || 'High'}
                          </span>
                        </div>
                        <p className="mb-3 text-xs text-muted-foreground">{item.status || 'No status'}</p>
                        <Link href={getActivityRoute(item)}>
                          <Button variant="outline" size="sm" className="w-full">
                            Open item
                          </Button>
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">No urgent items in queue. Great momentum.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Jump directly to the admin workstream you need.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { title: 'Review Reports', href: '/admin/reports', icon: FileText, hint: 'Investigate active report submissions' },
                { title: 'Manage Bounties', href: '/admin/bounties', icon: Award, hint: 'Track placed bounties and linked tips' },
                { title: 'Customer Feedback', href: '/admin/customer-feedback', icon: MessageSquare, hint: 'Respond to user sentiment and issues' },
                { title: 'Create News', href: '/admin/news-editor', icon: PlusCircle, hint: 'Publish updates to keep users informed' },
              ].map((action) => (
                <Link key={action.title} href={action.href}>
                  <div className="group rounded-xl border border-border/70 bg-card p-4 transition-colors hover:bg-muted/40">
                    <div className="mb-3 flex items-center justify-between">
                      <action.icon className="h-5 w-5 text-primary" />
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <p className="mb-1 text-sm font-semibold">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.hint}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </PageContentWrapper>
    </>
  );
};

export default Overview;