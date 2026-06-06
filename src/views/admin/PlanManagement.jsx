import React, { useState, useEffect, useCallback } from 'react';
import PageHead from '@/components/PageHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/customSupabaseClient';
import { FieldError, FieldSuccess, PageErrorBanner } from '@/components/ui/form-feedback';
import { Save } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useAdminData } from '@/contexts/AdminDataContext';
import PageContentWrapper from '@/components/admin/PageContentWrapper';
import PageHeader from '@/components/admin/PageHeader';
const availablePages = ['Overview', 'Reports', 'Customer Feedback', 'Report Details', 'Triage', 'User Management', 'Organizations', 'Unmatched Organization', 'Plan Management', 'Plan Features', 'Audit Logs', 'Billing', 'Settings', 'Trashed Reports', 'Reward', 'Bounties', 'News Editor', 'Bounty Details'];
const allRoles = [{
  key: 'super_admin',
  label: 'Super Admin'
}, {
  key: 'executive_admin',
  label: 'Executive Admin'
}, {
  key: 'organization_admin',
  label: 'Organization Admin'
}, {
  key: 'staff',
  label: 'Staff'
}, {
  key: 'customer_care',
  label: 'Customer Care'
}];
const PlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [reportLimits, setReportLimits] = useState({});
  const [activeTab, setActiveTab] = useState('');
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [saveFeedback, setSaveFeedback] = useState({ error: '', success: '' });
  const { profile, loading: profileLoading } = useAuth();
  const { fetchPlans, loading } = useAdminData();
  
  const loadPlansData = useCallback(async () => {
    if (profile?.user_type !== 'super_admin') return;
    setFetchError('');
    
    try {
      const plansData = await fetchPlans();
      setPlans(plansData);
      if (plansData.length > 0) {
        setActiveTab(plansData[0].id);
        const limits = plansData.reduce((acc, plan) => {
          acc[plan.id] = plan.monthly_report_limit || 0;
          return acc;
        }, {});
        setReportLimits(limits);
      }
      
      const { data: permsData, error: permsError } = await supabase
        .from('plan_role_permissions')
        .select('*');
      if (permsError) throw permsError;
      
      const formattedPermissions = permsData.reduce((acc, p) => {
        if (!acc[p.plan_id]) acc[p.plan_id] = {};
        if (!acc[p.plan_id][p.role]) acc[p.plan_id][p.role] = {};
        acc[p.plan_id][p.role][p.page_name] = p.can_view;
        return acc;
      }, {});
      setPermissions(formattedPermissions);
      
    } catch (error) {
      console.error('Failed to load plans data:', error);
      setFetchError(error.message);
    }
  }, [profile?.user_type, fetchPlans]);

  useEffect(() => {
    if (!profileLoading) {
      loadPlansData();
    }
  }, [profileLoading, loadPlansData]);
  const getRolesForPlan = planName => {
    const standardRoles = allRoles.filter(r => r.key !== 'super_admin');
    if (planName === 'Executive') {
      return standardRoles;
    }
    return standardRoles;
  };
  const handlePermissionChange = (planId, roleKey, pageName, value) => {
    setPermissions(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [roleKey]: {
          ...(prev[planId]?.[roleKey] || {}),
          [pageName]: value
        }
      }
    }));
  };
  const handleReportLimitChange = (planId, value) => {
    setReportLimits(prev => ({
      ...prev,
      [planId]: value
    }));
  };
  const handleSaveChanges = async (planId, rolesForPlan) => {
    setSaving(true);
    setSaveFeedback({ error: '', success: '' });
    try {
      // Update report limit
      const {
        error: limitError
      } = await supabase.from('plans').update({
        monthly_report_limit: reportLimits[planId]
      }).eq('id', planId);
      if (limitError) throw limitError;

      // Prepare permissions for upsert, including seeding missing ones
      const permissionsToUpsert = [];
      for (const role of rolesForPlan) {
        for (const page of availablePages) {
          const hasPermission = permissions[planId]?.[role.key]?.[page] || false;
          permissionsToUpsert.push({
            plan_id: planId,
            role: role.key,
            page_name: page,
            can_view: hasPermission
          });
        }
      }
      if (permissionsToUpsert.length > 0) {
        const {
          error: permsError
        } = await supabase.from('plan_role_permissions').upsert(permissionsToUpsert, {
          onConflict: 'plan_id, role, page_name'
        });
        if (permsError) throw permsError;
      }
      setSaveFeedback({ error: '', success: 'Plan settings saved successfully!' });
    } catch (error) {
      setSaveFeedback({ error: error.message, success: '' });
    } finally {
      setSaving(false);
    }
  };
  if (profile?.user_type !== 'super_admin') {
    return <div className="p-4 text-center text-muted-foreground">
                You do not have permission to view this page.
            </div>;
  }
  return <>
            <PageHead title="Plan Permissions Management - WhistleBlower.ng" />
            <PageContentWrapper loading={loading.plans || profileLoading} loadingText="Loading plan management data...">
              <div className="space-y-8">
                <PageHeader 
                  title="Plan Management" 
                  description="Control which features each plan can access and set report limits."
                />
                <PageErrorBanner error={fetchError} title="Could not load plan management data" />
                <FieldError message={saveFeedback.error} />
                <FieldSuccess message={saveFeedback.success} />
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="overflow-x-auto">
                        <TabsList className="w-full sm:w-auto flex-nowrap">
                            {plans.map(plan => <TabsTrigger key={plan.id} value={plan.id} className="whitespace-nowrap">{plan.name}</TabsTrigger>)}
                        </TabsList>
                    </div>
                    {plans.map(plan => {
          const rolesForPlan = getRolesForPlan(plan.name);
          return <TabsContent key={plan.id} value={plan.id} className="space-y-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <h3 className="text-xl font-semibold">{plan.name} Plan Settings</h3>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                                    <Label htmlFor={`limit-${plan.id}`} className="whitespace-nowrap">Monthly Report Limit</Label>
                                                    <Input id={`limit-${plan.id}`} type="number" className="w-24 flex-shrink-0" value={reportLimits[plan.id] || 0} onChange={e => handleReportLimitChange(plan.id, parseInt(e.target.value, 10))} />
                                                </div>
                                                <Button onClick={() => handleSaveChanges(plan.id, rolesForPlan)} loading={saving} className="w-full sm:w-auto">
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Save Plan Settings
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="border rounded-lg overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[250px] font-bold">PAGE / FEATURE</TableHead>
                                                        {rolesForPlan.map(role => <TableHead key={role.key} className="text-center font-bold">{role.label.toUpperCase()}</TableHead>)}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {availablePages.map(page => <TableRow key={page}>
                                                            <TableCell className="font-medium">{page}</TableCell>
                                                            {rolesForPlan.map(role => <TableCell key={role.key} className="text-center">
                                                                    <Switch checked={permissions[plan.id]?.[role.key]?.[page] || false} onCheckedChange={checked => handlePermissionChange(plan.id, role.key, page, checked)} />
                                                                </TableCell>)}
                                                        </TableRow>)}
                                                </TableBody>
                                            </Table>
                                        </div>
                            </TabsContent>;
        })}
                </Tabs>
              </div>
            </PageContentWrapper>
        </>;
};
export default PlanManagement;