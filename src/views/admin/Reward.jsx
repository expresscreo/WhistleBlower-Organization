import React from 'react';
import PageHead from '@/components/PageHead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PageContentWrapper from '@/components/admin/PageContentWrapper';
import PageHeader from '@/components/admin/PageHeader';

const Reward = () => {
  return (
    <>
      <PageHead title="Reward Management — WhistleBlower.ng" />
      <div className="space-y-8">
        <PageHeader 
          title="Reward Management"
          description="This page is deprecated. Please use the main Reward page."
        />
        <Card>
          <CardContent>
            <p className="text-center py-8 text-muted-foreground">
              This page is deprecated. Please use RewardPage.jsx
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Reward;