'use client';

import { Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStepNumber } from './placeBountyStepMeta';
import { formatIncidentDate } from '@/components/submit-report/reportFormUtils';

function ReviewRow({ label, value, onEdit, step }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3 border-b last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <p className="text-sm break-words">{value}</p>
      </div>
      {onEdit && step != null && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 h-8 gap-1 text-primary"
          onClick={() => onEdit(step)}
        >
          <Edit2 className="h-3.5 w-3.5" />
          Edit
        </Button>
      )}
    </div>
  );
}

export default function BountyReviewSummary({ formData, files, onGoToStep, steps }) {
  const step = (id) => getStepNumber(steps, id);

  const caseSummary = [formData.title, formData.typeOfCrime].filter(Boolean).join(' · ');
  const location = [formData.state, formData.lga, formData.fullAddress].filter(Boolean).join(' · ');
  const evidenceSummary =
    files.length === 0
      ? 'No files attached'
      : `${files.length} file${files.length > 1 ? 's' : ''} attached`;
  const amount = (formData.bountyAmount || '').replace(/,/g, '');
  const amountSummary = amount ? `₦${Number(amount).toLocaleString()}` : '';

  return (
    <div className="rounded-lg border bg-muted/20 divide-y">
      <ReviewRow
        label="Case"
        value={caseSummary || '—'}
        onEdit={onGoToStep}
        step={step('case')}
      />
      <ReviewRow
        label="Description"
        value={
          formData.description?.slice(0, 120) +
          (formData.description?.length > 120 ? '…' : '')
        }
        onEdit={onGoToStep}
        step={step('case')}
      />
      <ReviewRow
        label="Location & date"
        value={[location, formatIncidentDate(formData.dateOfIncident)].filter(Boolean).join(' · ') || '—'}
        onEdit={onGoToStep}
        step={step('location')}
      />
      <ReviewRow
        label="Evidence"
        value={evidenceSummary}
        onEdit={onGoToStep}
        step={step('evidence')}
      />
      <ReviewRow
        label="Bounty amount"
        value={amountSummary}
        onEdit={onGoToStep}
        step={step('reward')}
      />
    </div>
  );
}
