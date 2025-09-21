import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle, CheckCircle, Search, Loader2, BarChart, PieChart as PieChartIcon, Users, ArrowRight, PlusCircle, MessageSquare } from 'lucide-react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useAdminData } from '@/contexts/AdminDataContext';
import { format, subDays, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import PageContentWrapper from '@/components/admin/PageContentWrapper';
import PageHeader from '@/components/admin/PageHeader';

const COLORS = ['#ff5100', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ec4899'];

const StatCard = ({ title, value, icon, link }) => {
  const navigate = useNavigate();
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(link)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

const Overview = () => {
  const [stats, setStats] = useState({ total: 0, underReview: 0, urgent: 0, resolved: 0 });
  const [reportsByCategory, setReportsByCategory] = useState([]);
  const [reportsOverTime, setReportsOverTime] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [highPriorityReports, setHighPriorityReports] = useState([]);
  const { profile, loading: profileLoading } = useAuth();
  const { fetchReports, loading } = useAdminData();

  const processReportData = useCallback((reportData) => {
    const total = reportData.length;
    const underReview = reportData.filter(r => r.status === 'Under Review').length;
    const urgent = reportData.filter(r => r.urgency === 'Critical' || r.urgency === 'High').length;
    const resolved = reportData.filter(r => r.status === 'Resolved').length;
    setStats({ total, underReview, urgent, resolved });

    const categoryCounts = reportData.reduce((acc, report) => {
        const category = report.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {});
    setReportsByCategory(Object.entries(categoryCounts).map(([name, value]) => ({ name, value })));

    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentReports = reportData.filter(r => new Date(r.created_at) > thirtyDaysAgo);
    const timeCounts = recentReports.reduce((acc, report) => {
        const date = format(new Date(report.created_at), 'MMM dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
    }, {});
    const overTimeData = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), i);
        const formattedDate = format(date, 'MMM dd');
        return { name: formattedDate, reports: timeCounts[formattedDate] || 0 };
    }).reverse();
    setReportsOverTime(overTimeData);

    setRecentActivity(reportData.slice(0, 5));
    setHighPriorityReports(reportData.filter(r => (r.urgency === 'Critical' || r.urgency === 'High') && r.status !== 'Resolved').slice(0, 5));
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!profile || profileLoading) return;
    
    try {
      const reportData = await fetchReports();
      processReportData(reportData);
    } catch (error) {
      // Error handling is done in the context
      console.error('Failed to load dashboard data:', error);
    }
  }, [profile, profileLoading, fetchReports, processReportData]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);
  
  const planName = profile?.plans?.name;
  const canSeeAdvancedFeatures = profile && (profile.user_type === 'super_admin' || ['Executive', 'ExpressCreo'].includes(planName));

  return (
    <>
      <Helmet><title>Dashboard Overview - WhistleBlower.ng</title></Helmet>
      <PageContentWrapper loading={loading.reports} loadingText="Loading dashboard data...">
        <div className="space-y-8">
          <PageHeader 
            title={`Welcome back, ${profile?.name || 'Admin'}!`}
            description="Here's a summary of what's happening."
          />
        
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Reports" value={stats.total} icon={<FileText className="h-4 w-4 text-primary" />} link="/admin/reports" />
          <StatCard title="Under Review" value={stats.underReview} icon={<Search className="h-4 w-4 text-primary" />} link="/admin/reports?status=Under+Review" />
          <StatCard title="Urgent Reports" value={stats.urgent} icon={<AlertTriangle className="h-4 w-4 text-primary" />} link="/admin/reports?urgency=High" />
          <StatCard title="Resolved Reports" value={stats.resolved} icon={<CheckCircle className="h-4 w-4 text-primary" />} link="/admin/reports?status=Resolved" />
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Reports Over Time (Last 30 Days)</CardTitle></CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={300}>
                <ReBarChart data={reportsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="reports" fill="#ff5100" />
                </ReBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Reports by Category</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RePieChart>
                  <Pie data={reportsByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                    return percent > 0.05 ? (<text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">{(percent * 100).toFixed(0)}%</text>) : null;
                  }}>
                    {reportsByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {canSeeAdvancedFeatures && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>The latest reports submitted to the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-4">
                      {recentActivity.map(report => (
                          <div key={report.report_id} className="flex items-start sm:items-center flex-col sm:flex-row gap-2 sm:gap-0">
                              <div className="flex items-center flex-1 min-w-0">
                                  <div className="flex h-8 w-8 items-center justify-center bg-muted flex-shrink-0">
                                      {report.is_anonymous ? <Users className="h-4 w-4 text-muted-foreground" /> : <MessageSquare className="h-4 w-4 text-muted-foreground" />}
                                  </div>
                                  <div className="ml-4 space-y-1 min-w-0 flex-1">
                                      <p className="text-sm font-medium leading-none truncate">{report.title}</p>
                                      <p className="text-sm text-muted-foreground">New report #{report.report_id} in {report.category}</p>
                                  </div>
                              </div>
                              <div className="font-medium text-sm text-muted-foreground ml-12 sm:ml-auto flex-shrink-0">{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</div>
                          </div>
                      ))}
                  </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                  <CardTitle>High Priority</CardTitle>
                  <CardDescription>Urgent reports that need your attention.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                  {highPriorityReports.length > 0 ? highPriorityReports.map(report => (
                       <div key={report.report_id} className="flex items-start justify-between">
                           <div>
                              <p className="font-semibold text-sm truncate max-w-[150px]">{report.title}</p>
                              <span className={cn("text-xs px-2 py-0.5", report.urgency === 'Critical' ? 'bg-destructive/20 text-destructive' : 'bg-amber-500/20 text-amber-600')}>{report.urgency}</span>
                           </div>
                           <Link to={`/admin/reports/${report.id}`}>
                              <Button variant="outline" size="sm">View</Button>
                           </Link>
                       </div>
                  )) : (
                      <p className="text-sm text-muted-foreground text-center py-8">No urgent reports. Great job!</p>
                  )}
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </PageContentWrapper>
    </>
  );
};

export default Overview;