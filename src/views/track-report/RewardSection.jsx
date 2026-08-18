import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Gift, Copy } from 'lucide-react';
import { FieldError } from '@/components/ui/form-feedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

const RewardSection = ({ report }) => {
    const { status, reward_paycode, reward_status, reward_paycode_expires_at } = report;
    const [copyError, setCopyError] = useState('');

    const handleCopy = async () => {
        setCopyError('');
        try {
            await navigator.clipboard.writeText(reward_paycode);
        } catch {
            setCopyError('Could not copy paycode to clipboard.');
        }
    };

    if (status !== 'Resolved') {
        return (
            <Card className="bg-muted/50 border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift /> Reward Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Once this report is marked as "Resolved" and a reward is approved by WhistleBlower.ng, you will be able to claim it here.</p>
                </CardContent>
            </Card>
        );
    }

    if (reward_status === 'paid' && reward_paycode) {
        const expiresLabel = reward_paycode_expires_at
            ? format(new Date(reward_paycode_expires_at), 'PPP p')
            : null;

        return (
            <Card className="border-primary bg-primary/5">
                <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2"><Gift /> Your Reward is Ready!</CardTitle>
                    <CardDescription>Your reward has been processed. Use the Paycode below to withdraw your funds at any Moniepoint POS or agent.</CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">Your Paycode:</p>
                    <div className="flex items-center justify-center gap-2 bg-background p-3 border">
                        <p className="text-2xl font-bold tracking-widest">{reward_paycode}</p>
                        <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy paycode">
                            <Copy className="h-5 w-5" />
                        </Button>
                    </div>
                    <FieldError message={copyError} />
                    {expiresLabel ? (
                        <p className="text-xs text-muted-foreground">Expires: {expiresLabel}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">Present this code at any Moniepoint POS terminal or agent to withdraw your reward in cash. No bank account is required.</p>
                </CardContent>
            </Card>
        );
    }
    
    if (reward_status === 'pending_request') {
        return (
             <Card className="bg-muted/50 border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift /> Reward Pending</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Your reward request is being reviewed by WhistleBlower.ng. Please check back later for your Monnify Paycode.</p>
                </CardContent>
            </Card>
        );
    }

    if (reward_status === 'rejected') {
        return (
            <Card className="bg-muted/50 border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift /> Reward Not Approved</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This reward request was not approved. Contact support if you believe this is an error.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-muted/50 border-dashed">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Gift /> Reward Information</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">This report has been resolved. The organization may submit a reward request for WhistleBlower.ng approval. Please check back later for updates.</p>
            </CardContent>
        </Card>
    );
};

export default RewardSection;
