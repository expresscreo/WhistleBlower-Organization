import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ReportStatusCard = ({ status, onStatusUpdate }) => {
    return (
        <Card>
            <CardHeader><CardTitle className="text-2xl">Update Status</CardTitle></CardHeader>
            <CardContent>
                <Select value={status} onValueChange={onStatusUpdate}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Under Review">Under Review</SelectItem>
                        <SelectItem value="Assigned">Assigned</SelectItem>
                        <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </CardContent>
        </Card>
    );
};

export default ReportStatusCard;