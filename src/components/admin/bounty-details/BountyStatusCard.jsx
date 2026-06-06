import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BOUNTY_STATUS,
  formatBountyStatusLabel,
  getAdminSelectableBountyStatuses,
} from '@/lib/bountyStatus';

const BountyStatusCard = ({
  status,
  onStatusUpdate,
  hunterReportCount = 0,
}) => {
  const selectableStatuses = getAdminSelectableBountyStatuses(status, hunterReportCount);
  const canConfirmReportReceived =
    status === BOUNTY_STATUS.PUBLISHED && hunterReportCount > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={status} onValueChange={onStatusUpdate}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {selectableStatuses.map((value) => (
              <SelectItem key={value} value={value}>
                {formatBountyStatusLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canConfirmReportReceived && (
          <p className="text-sm text-muted-foreground">
            {hunterReportCount} hunter report{hunterReportCount === 1 ? '' : 's'} linked.
            Review the submission first, then select Report Received if it is legitimate.
          </p>
        )}

        {status === BOUNTY_STATUS.REPORT_RECEIVED && (
          <p className="text-sm text-muted-foreground">
            Report Received confirms an admin-reviewed hunter submission.
            {hunterReportCount > 0
              ? ` ${hunterReportCount} report${hunterReportCount === 1 ? '' : 's'} linked.`
              : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BountyStatusCard;
