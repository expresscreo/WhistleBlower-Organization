import React, { useState, useCallback } from 'react';
import PageHead from '@/components/PageHead';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/customSupabaseClient';
import { parseFormattedNumber } from '@/lib/utils';
import { FieldError, FieldSuccess, PageErrorBanner } from '@/components/ui/form-feedback';
import { Save } from 'lucide-react';
import NavbarLoader from '@/components/admin/NavbarLoader';
import PageHeader from '@/components/admin/PageHeader';
import PageContentWrapper from '@/components/admin/PageContentWrapper';
import { useLoadOnce } from '@/hooks/useLoadOnce';

const PlanFeatures = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [planFeedback, setPlanFeedback] = useState({});
  const [savingPlanId, setSavingPlanId] = useState(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    const { data, error } = await supabase.from('plans').select('*').order('price');
    if (error) {
      setFetchError(error.message);
    } else {
      setPlans(data.map(p => ({ ...p, features: p.feature_flags?.features || [] })));
    }
    setLoading(false);
  }, []);

  useLoadOnce(true, fetchPlans);

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
    const parsedPrice = parseFormattedNumber(planData.price);
    const parsedLimit = parseFormattedNumber(planData.report_limit);
    if (planData.price !== '' && planData.price != null) {
      planData.price = Number.isFinite(parsedPrice) ? parsedPrice : planData.price;
    }
    if (planData.report_limit !== '' && planData.report_limit != null) {
      planData.report_limit = Number.isFinite(parsedLimit) ? parsedLimit : planData.report_limit;
    }

    setPlanFeedback((prev) => ({ ...prev, [planId]: { error: '', success: '' } }));
    setSavingPlanId(planId);
    try {
      const { error } = await supabase.from('plans').update(planData).eq('id', planId);
      if (error) {
        setPlanFeedback((prev) => ({ ...prev, [planId]: { error: error.message, success: '' } }));
      } else {
        setPlanFeedback((prev) => ({ ...prev, [planId]: { error: '', success: `${plan.name} plan saved successfully!` } }));
      }
    } finally {
      setSavingPlanId(null);
    }
  };

  return (
    <>
      <PageHead title="Plan Features — WhistleBlower.ng" />
      <div className="space-y-8">
        <PageHeader 
          title="Plan Features Management"
          description="Update plan information that appears on the public pricing page."
        />

        <PageErrorBanner error={fetchError} title="Could not load plans" />
        
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price (Numeric)</Label>
                      <Input
                        type="number"
                        value={plan.price || ''}
                        onChange={e => handlePlanChange(plan.id, 'price', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Report Limit (-1 for unlimited)</Label>
                      <Input
                        type="number"
                        allowNegative
                        value={plan.report_limit ?? ''}
                        onChange={e => handlePlanChange(plan.id, 'report_limit', e.target.value)}
                      />
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
                  <Button onClick={() => handleSavePlan(plan.id)} loading={savingPlanId === plan.id}><Save className="mr-2 h-4 w-4" />Save {plan.name} Plan</Button>
                  <FieldError message={planFeedback[plan.id]?.error} className="mt-2" />
                  <FieldSuccess message={planFeedback[plan.id]?.success} className="mt-2" />
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