import React from 'react';
import { Button } from '@/components/ui/button';
import { Gift, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const RewardSection = ({ report }) => {
    const { toast } = useToast();
    const { status, reward_paycode, reward_status } = report;

    const handleCopy = () => {
        navigator.clipboard.writeText(reward_paycode);
        toast({ title: "Copied!", description: "Paycode copied to clipboard." });
    };

    if (status !== 'Resolved') {
        return (
            <Card className="bg-muted/50 border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Gift /> Reward Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Once this report is marked as "Resolved" and a reward is approved by the organization, you will be able to claim it here.</p>
                </CardContent>
            </Card>
        );
    }

    if (reward_status === 'paid' && reward_paycode) {
        return (
            <Card className="border-primary bg-primary/5">
                <CardHeader>
                    <CardTitle className="text-primary flex items-center gap-2"><Gift /> Your Reward is Ready!</CardTitle>
                    <CardDescription>Your reward has been processed. Use the Paycode below to withdraw your funds.</CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">Your Paycode:</p>
                    <div className="flex items-center justify-center gap-2 bg-background p-3 border">
                        <p className="text-2xl font-bold tracking-widest">{reward_paycode}</p>
                        <Button variant="ghost" size="icon" onClick={handleCopy}>
                            <Copy className="h-5 w-5" />
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">You can use this code at any supported ATM or Point-of-Sale (POS) terminal to withdraw your reward. No bank account is required.</p>
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
                    <p className="text-muted-foreground">The organization has been notified and your reward request is currently being processed. Please check back later.</p>
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
                <p className="text-muted-foreground">This report has been resolved. The organization has been notified to process a potential reward. Please check back later for updates.</p>
            </CardContent>
        </Card>
    );
};

export default RewardSection;