import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save } from 'lucide-react';
import NavbarLoader from '@/components/admin/NavbarLoader';
import PageHeader from '@/components/admin/PageHeader';
import PageContentWrapper from '@/components/admin/PageContentWrapper';

const PlanFeatures = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('plans').select('*').order('price');
    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching plans', description: error.message });
    } else {
      setPlans(data.map(p => ({ ...p, features: p.feature_flags?.features || [] })));
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handlePlanChange = (planId, field, value) => {
    setPlans(plans.map(p => p.id === planId ? { ...p, [field]: value } : p));
  };

  const handleFeatureChange = (planId, featureIndex, value) => {
    setPlans(plans.map(p => {
      if (p.id === planId) {
        const newFeatures = [...p.features];
        newFeatures[featureIndex] = value;
        return { ...p, features: newFeatures };
      }
      return p;
    }));
  };

  const handleSavePlan = async (planId) => {
    const plan = plans.find(p => p.id === planId);
    const { id, features, ...planData } = plan;
    planData.feature_flags = { features };
    
    const { error } = await supabase.from('plans').update(planData).eq('id', planId);
    if (error) {
      toast({ variant: 'destructive', title: `Failed to save ${plan.name} plan`, description: error.message });
    } else {
      toast({ title: `${plan.name} plan saved successfully!` });
    }
  };

  return (
    <>
      <Helmet><title>Plan Features - WhistleBlower.ng</title></Helmet>
      <div className="space-y-8">
        <PageHeader 
          title="Plan Features Management"
          description="Update plan information that appears on the public pricing page."
        />
        
        {/* Plan Details */}
        <div className="space-y-8">
          {loading ? (
            <>
              <NavbarLoader />
              <div className="flex justify-center py-16">
                {/* Loading indication is handled by NavbarLoader */}
              </div>
            </>
          ) : (
            plans.map(plan => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price (Numeric)</Label>
                      <Input type="number" value={plan.price || ''} onChange={e => handlePlanChange(plan.id, 'price', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Report Limit (-1 for unlimited)</Label>
                      <Input type="number" value={plan.report_limit || ''} onChange={e => handlePlanChange(plan.id, 'report_limit', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Features (one per line)</Label>
                    <Textarea
                      value={plan.features.join('\n')}
                      onChange={e => handlePlanChange(plan.id, 'features', e.target.value.split('\n'))}
                      rows={8}
                    />
                  </div>
                  <Button onClick={() => handleSavePlan(plan.id)}><Save className="mr-2 h-4 w-4" />Save {plan.name} Plan</Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default PlanFeatures;