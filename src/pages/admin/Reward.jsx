import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const Reward = () => {
  return (
    <>
      <Helmet>
        <title>Reward Management - WhistleBlower.ng</title>
      </Helmet>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Reward Management</h1>
        <Card>
          <CardHeader>
            <CardTitle>Rewards</CardTitle>
            <div className="mt-4">
              <Input placeholder="Search rewards..." />
            </div>
          </CardHeader>
          <CardContent>
            <p>This page is deprecated. Please use RewardPage.jsx</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Reward;