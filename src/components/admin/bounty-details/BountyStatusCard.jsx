import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const bountyStatuses = [
    'pending_review',
    'approved',
    'published',
    'resolved',
    'rejected',
    'refunded'
];

const toTitleCase = (str) => {
    if (!str) return '';
    return str.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

const BountyStatusCard = ({ status, onStatusUpdate }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent>
                <Select value={status} onValueChange={onStatusUpdate}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        {bountyStatuses.map(s => (
                            <SelectItem key={s} value={s}>{toTitleCase(s)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    );
};

export default BountyStatusCard;